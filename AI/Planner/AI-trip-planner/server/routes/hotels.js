import express from 'express';
import amadeus from '../services/amadeusClient.js';
import Hotel from '../models/Hotel.js';

const router = express.Router();

const cityCodeCache = {};

// Utility: Wait
const delay = ms => new Promise(res => setTimeout(res, ms));

// ✅ Format city name for Amadeus
const formatCityForAmadeus = (cityName) => {
  let formatted = cityName
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, ' ');

  formatted = formatted
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');

  return formatted;
};

// ✅ Get city IATA code (reuse from flights logic)
async function getCityCode(cityName, retries = 3) {
  const formattedCity = formatCityForAmadeus(cityName);
  
  if (cityCodeCache[formattedCity]) {
    console.log(`✅ Cache hit for ${formattedCity}: ${cityCodeCache[formattedCity]}`);
    return cityCodeCache[formattedCity];
  }

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`🔍 Attempt ${attempt}: Getting city code for "${formattedCity}"`);
      
      let response = await amadeus.referenceData.locations.get({
        keyword: formattedCity,
        subType: 'CITY'
      });

      if (!response.data.length) {
        response = await amadeus.referenceData.locations.get({
          keyword: formattedCity,
          subType: 'AIRPORT'
        });
      }

      if (!response.data.length) {
        response = await amadeus.referenceData.locations.get({
          keyword: formattedCity
        });
      }

      if (!response.data.length) {
        throw new Error(`City not found: ${formattedCity}`);
      }

      const code = response.data[0].iataCode;
      cityCodeCache[formattedCity] = code;
      cityCodeCache[cityName.toLowerCase()] = code;
      
      console.log(`✅ Found city code for ${formattedCity}: ${code}`);
      return code;
      
    } catch (err) {
      const isRateLimit = err?.description?.[0]?.status === 429;

      if (isRateLimit && attempt < retries) {
        console.warn(`⏳ Rate limit hit, waiting...`);
        await delay(2000);
      } else if (attempt < retries) {
        await delay(1000);
      } else {
        throw err;
      }
    }
  }

  throw new Error(`Could not get city code for: ${formattedCity}`);
}

// 🏨 Search hotels endpoint - WORLDWIDE
router.get('/search-hotels', async (req, res) => {
  let { city, cityCode, checkInDate, checkOutDate, adults } = req.query;

  console.log('🏨 Hotel Search Request:', { city, cityCode, checkInDate, checkOutDate, adults });

  // Validation
  if ((!city && !cityCode) || !checkInDate || !checkOutDate) {
    return res.status(400).json({ 
      success: false,
      message: 'Missing required parameters: (city or cityCode), checkInDate, checkOutDate' 
    });
  }

  try {
    // Step 1: Get city code if only city name provided
    if (!cityCode && city) {
      console.log(`🔍 Getting city code for: ${city}`);
      cityCode = await getCityCode(city);
    }

    console.log(`🌍 Searching hotels in: ${city || cityCode} (${cityCode})`);

    // Step 2: Get hotels in the city
    console.log('📍 Getting hotels by city...');
    const hotelsInCity = await amadeus.referenceData.locations.hotels.byCity.get({
      cityCode: cityCode,
      radius: 20,
      radiusUnit: 'KM'
    });

    if (!hotelsInCity.data || hotelsInCity.data.length === 0) {
      return res.json({
        success: true,
        count: 0,
        hotels: [],
        message: `No hotels found in ${city || cityCode}`
      });
    }

    console.log(`✅ Found ${hotelsInCity.data.length} hotels in city`);

    // Step 3: Get hotel IDs (limit to first 50 for performance)
    const hotelIds = hotelsInCity.data
      .slice(0, 50)
      .map(hotel => hotel.hotelId)
      .join(',');

    // Step 4: Search for hotel offers
    console.log(`🔎 Searching offers for hotels...`);
    
    const hotelOffers = await amadeus.shopping.hotelOffersSearch.get({
      hotelIds: hotelIds,
      checkInDate: checkInDate,
      checkOutDate: checkOutDate,
      adults: adults || 1,
      roomQuantity: 1,
      currency: 'USD',
      bestRateOnly: true
    });

    if (!hotelOffers.data || hotelOffers.data.length === 0) {
      return res.json({
        success: true,
        count: 0,
        hotels: [],
        message: `No available hotel offers for these dates in ${city || cityCode}`
      });
    }

    console.log(`✅ Found ${hotelOffers.data.length} hotel offers`);

    // Step 5: Format the response
    const simplifiedHotels = hotelOffers.data.map((hotelOffer, index) => {
      const hotel = hotelOffer.hotel;
      const offer = hotelOffer.offers?.[0];
      
      return {
        // ✅ FIX: Use numeric ID instead of string
        id: index + 1,
        hotelId: hotel.hotelId,
        name: hotel.name,
        
        // Location
        address: {
          lines: hotel.address?.lines || [],
          cityName: hotel.address?.cityName,
          countryCode: hotel.address?.countryCode,
          postalCode: hotel.address?.postalCode
        },
        
        // Contact
        contact: {
          phone: hotel.contact?.phone,
          email: hotel.contact?.email
        },
        
        // Coordinates
        location: hotel.latitude && hotel.longitude ? {
          latitude: hotel.latitude,
          longitude: hotel.longitude
        } : null,
        
        // Price
        price: {
          total: parseFloat(offer?.price?.total || 0),
          currency: offer?.price?.currency || 'USD',
          perNight: offer?.price?.base || offer?.price?.total,
          taxes: offer?.price?.taxes?.map(tax => ({
            amount: tax.amount,
            currency: tax.currency,
            description: tax.description
          })) || []
        },
        
        // Room info
        room: {
          type: offer?.room?.type,
          typeEstimated: offer?.room?.typeEstimated?.category,
          description: offer?.room?.description?.text,
          beds: offer?.room?.beds
        },
        
        // Policies
        policies: {
          cancellation: offer?.policies?.cancellation,
          checkIn: offer?.policies?.checkInTime,
          checkOut: offer?.policies?.checkOutTime
        },
        
        // Availability
        available: offer?.available || true,
        
        // Rating
        rating: hotel.rating,
        
        // Amenities
        amenities: hotel.amenities
      };
    });

    // Sort by price (cheapest first)
    simplifiedHotels.sort((a, b) => a.price.total - b.price.total);

    // Step 6: Save to MongoDB (optional)
    try {
      if (Hotel) {
        // ✅ FIX: Remove id field before saving
        const hotelsForDB = simplifiedHotels.map(hotel => {
          const { id, ...hotelData } = hotel;
          return hotelData;
        });
        
        await Hotel.deleteMany({ 
          'address.cityName': city || cityCode
        });
        await Hotel.insertMany(hotelsForDB);
        console.log('✅ Hotels saved to MongoDB');
      }
    } catch (dbError) {
      console.warn('⚠️ MongoDB save failed (non-critical):', dbError.message);
      // Continue anyway
    }

    // ✅ Always return the data regardless of DB status
    res.json({
      success: true,
      count: simplifiedHotels.length,
      city: city || cityCode,
      cityCode: cityCode,
      checkIn: checkInDate,
      checkOut: checkOutDate,
      hotels: simplifiedHotels
    });

  } catch (error) {
    console.error('❌ Hotel search error:', error);

    // Rate limit
    if (error?.description?.[0]?.status === 429) {
      return res.status(429).json({ 
        success: false,
        message: 'Rate limit exceeded. Please try again in a moment.' 
      });
    }

    // City not found
    if (error.message.includes('not found')) {
      return res.status(404).json({ 
        success: false,
        message: `City not found: ${city || cityCode}. Please check spelling.` 
      });
    }

    // No hotels available
    if (error?.description?.[0]?.code === 'NO_HOTELS_FOUND') {
      return res.json({
        success: true,
        count: 0,
        hotels: [],
        message: 'No hotels available in this area'
      });
    }

    res.status(500).json({ 
      success: false,
      message: 'Failed to search hotels',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// 🧪 Test endpoint
router.get('/test-city-hotels', async (req, res) => {
  const { city } = req.query;
  
  if (!city) {
    return res.status(400).json({ message: 'Provide ?city=CityName' });
  }
  
  try {
    const cityCode = await getCityCode(city);
    
    const hotelsInCity = await amadeus.referenceData.locations.hotels.byCity.get({
      cityCode: cityCode,
      radius: 20,
      radiusUnit: 'KM'
    });
    
    res.json({ 
      success: true,
      city,
      cityCode,
      hotelCount: hotelsInCity.data?.length || 0,
      message: `✅ Found ${hotelsInCity.data?.length || 0} hotels in ${city}`
    });
  } catch (error) {
    res.status(404).json({ 
      success: false,
      city,
      error: error.message
    });
  }
});

export default router;