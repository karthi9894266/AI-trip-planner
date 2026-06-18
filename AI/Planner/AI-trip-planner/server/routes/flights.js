import express from 'express';
import amadeus from '../services/amadeusClient.js';
import Flight from '../models/Flight.js';

const router = express.Router();

const iataCache = {};

// Utility: Wait
const delay = ms => new Promise(res => setTimeout(res, ms));

// ✅ Smart city name formatter for Amadeus API
const formatCityForAmadeus = (cityName) => {
  let formatted = cityName
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, ' ');

  formatted = formatted
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');

  console.log(`🔄 Formatted "${cityName}" → "${formatted}"`);
  return formatted;
};

// ✅ Get IATA code with retry, fallback search, and caching
async function getCityCode(keyword, retries = 3) {
  const formattedKeyword = formatCityForAmadeus(keyword);
  
  if (iataCache[formattedKeyword]) {
    console.log(`✅ Cache hit for ${formattedKeyword}: ${iataCache[formattedKeyword]}`);
    return iataCache[formattedKeyword];
  }

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`🔍 Attempt ${attempt}: Looking up IATA code for "${formattedKeyword}"`);
      
      let response = await amadeus.referenceData.locations.get({
        keyword: formattedKeyword,
        subType: 'CITY'
      });

      if (!response.data.length) {
        console.log(`⚠️ No CITY found, trying AIRPORT for: ${formattedKeyword}`);
        response = await amadeus.referenceData.locations.get({
          keyword: formattedKeyword,
          subType: 'AIRPORT'
        });
      }

      if (!response.data.length) {
        console.log(`⚠️ No AIRPORT found, trying general search for: ${formattedKeyword}`);
        response = await amadeus.referenceData.locations.get({
          keyword: formattedKeyword
        });
      }

      // ✅ If still no results, return city name directly instead of crashing
      if (!response.data.length) {
        console.warn(`⚠️ No IATA found for: ${formattedKeyword}, using city name directly.`);
        iataCache[formattedKeyword] = formattedKeyword;
        iataCache[keyword.toLowerCase()] = formattedKeyword;
        return formattedKeyword;
      }

      const location = response.data[0];
      const code = location.iataCode || formattedKeyword;
      
      console.log(`✅ Found IATA code for ${formattedKeyword}: ${code} (${location.name})`);
      
      iataCache[formattedKeyword] = code;
      iataCache[keyword.toLowerCase()] = code;
      
      return code;
      
    } catch (err) {
      const isRateLimit = err?.description?.[0]?.status === 429;

      if (isRateLimit && attempt < retries) {
        console.warn(`⏳ Retry ${attempt}: Amadeus rate limit hit. Waiting...`);
        await delay(2000);
      } else if (attempt < retries) {
        console.warn(`⚠️ Attempt ${attempt} failed, retrying...`);
        await delay(1000);
      } else {
        console.error(`❌ All attempts failed for ${formattedKeyword}:`, err.message);
        throw err;
      }
    }
  }

  throw new Error(`Could not get IATA code for: ${formattedKeyword}`);
}

// ✈️ Search flights endpoint
router.get('/search-flights', async (req, res) => {
  const { origin, destination, departureDate, returnDate } = req.query;

  console.log('📦 Flight Search Request:', { origin, destination, departureDate, returnDate });

  if (!origin || !destination || !departureDate) {
    return res.status(400).json({ 
      success: false,
      message: 'Missing required parameters: origin, destination, departureDate' 
    });
  }

  try {
    console.log('🌍 Getting IATA codes for worldwide cities...');
    const originCode = await getCityCode(origin);
    const destinationCode = await getCityCode(destination);

    console.log(`✈️ Route: ${origin} (${originCode}) → ${destination} (${destinationCode})`);

    console.log('🔎 Searching Amadeus for flight offers...');
    const flightRes = await amadeus.shopping.flightOffersSearch.get({
      originLocationCode: originCode,
      destinationLocationCode: destinationCode,
      departureDate,
      returnDate: returnDate || undefined,
      adults: 1,
      max: 10,
      currencyCode: 'USD'
    });

    console.log(`✅ Found ${flightRes.data.length} flight offers`);

    if (!flightRes.data.length) {
      return res.json({
        success: true,
        count: 0,
        flights: [],
        message: 'No flights found for this route'
      });
    }

    const simplified = flightRes.data.map((offer, index) => {
      const outbound = offer.itineraries[0];
      const outboundFirstSegment = outbound.segments[0];
      const outboundLastSegment = outbound.segments[outbound.segments.length - 1];
      
      const returnItinerary = offer.itineraries[1];
      
      return {
        // ✅ FIX: Use a simple numeric ID instead of string
        id: index + 1,
        price: parseFloat(offer.price.total),
        currency: offer.price.currency,
        outbound: {
          departureAirport: outboundFirstSegment.departure.iataCode,
          departureTime: outboundFirstSegment.departure.at,
          arrivalAirport: outboundLastSegment.arrival.iataCode,
          arrivalTime: outboundLastSegment.arrival.at,
          duration: outbound.duration,
          stops: outbound.segments.length - 1,
          carrier: outboundFirstSegment.carrierCode,
          flightNumber: `${outboundFirstSegment.carrierCode}${outboundFirstSegment.number}`
        },
        return: returnItinerary ? {
          departureAirport: returnItinerary.segments[0].departure.iataCode,
          departureTime: returnItinerary.segments[0].departure.at,
          arrivalAirport: returnItinerary.segments[returnItinerary.segments.length - 1].arrival.iataCode,
          arrivalTime: returnItinerary.segments[returnItinerary.segments.length - 1].arrival.at,
          duration: returnItinerary.duration,
          stops: returnItinerary.segments.length - 1,
          carrier: returnItinerary.segments[0].carrierCode,
          flightNumber: `${returnItinerary.segments[0].carrierCode}${returnItinerary.segments[0].number}`
        } : null,
        numberOfBookableSeats: offer.numberOfBookableSeats,
        oneWay: !returnItinerary
      };
    });

    // ✅ FIX: Optional MongoDB save - don't let it break the response
    try {
      // Remove the id field before saving to MongoDB
      const flightsForDB = simplified.map(flight => {
        const { id, ...flightData } = flight;
        return flightData;
      });
      
      await Flight.deleteMany({ 
        'outbound.departureAirport': originCode,
        'outbound.arrivalAirport': destinationCode 
      });
      await Flight.insertMany(flightsForDB);
      console.log('✅ Flights saved to MongoDB');
    } catch (dbError) {
      console.warn('⚠️ MongoDB save failed (non-critical):', dbError.message);
      // Continue anyway - the API response will still work
    }

    // ✅ Always return the simplified data regardless of DB save status
    res.json({
      success: true,
      count: simplified.length,
      route: {
        from: { city: origin, code: originCode },
        to: { city: destination, code: destinationCode }
      },
      flights: simplified
    });

  } catch (error) {
    console.error('❌ Flight search error:', error);

    // Rate limit error
    if (error?.description?.[0]?.status === 429) {
      return res.status(429).json({ 
        success: false,
        message: 'Rate limit exceeded. Please try again in a few moments.' 
      });
    }

    // City not found error
    const msg = error?.message || JSON.stringify(error);
    if (msg.includes('not found')) {
      return res.status(404).json({ 
        success: false,
        message: `Could not find airport/city. Please check spelling: ${msg}` 
      });
    }

    // No flights available
    if (error?.description?.[0]?.code === 'NO_FLIGHTS_FOUND') {
      return res.json({
        success: true,
        count: 0,
        flights: [],
        message: 'No flights available for this route and date'
      });
    }

    // General error
    res.status(500).json({ 
      success: false,
      message: 'Failed to search flights',
      error: process.env.NODE_ENV === 'development' ? msg : undefined
    });
  }
});

// 🧪 Test endpoint - Check if a city works
router.get('/test-city', async (req, res) => {
  const { city } = req.query;
  
  if (!city) {
    return res.status(400).json({ message: 'Provide ?city=CityName' });
  }
  
  try {
    const code = await getCityCode(city);
    res.json({ 
      success: true,
      original: city,
      formatted: formatCityForAmadeus(city),
      iataCode: code,
      message: `✅ ${city} is supported! IATA/code: ${code}`
    });
  } catch (error) {
    res.status(404).json({ 
      success: false,
      city,
      error: error.message,
      suggestion: 'Try using full city name or nearest major airport name'
    });
  }
});

// 📋 Get cached cities (for debugging)
router.get('/cached-cities', (req, res) => {
  res.json({
    success: true,
    count: Object.keys(iataCache).length,
    cities: iataCache
  });
});

export default router;