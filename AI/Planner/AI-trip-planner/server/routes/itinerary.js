import express from 'express';
import axios from 'axios';
import generateItinerary from '../utils/hfPlanner.js';

const router = express.Router();

console.log('✅ Itinerary router loaded');

// Test route to verify router is working
router.get('/test', (req, res) => {
  console.log('🧪 Test route hit!');
  res.json({ message: 'Itinerary router is working!' });
});

// Generate complete itinerary with flights and hotels
router.post('/generate-itinerary', async (req, res) => {
  console.log('🎯 ROUTE HIT! generate-itinerary endpoint called');
  console.log('📦 Request body:', JSON.stringify(req.body, null, 2));
  
  const { 
    destination, 
    numberOfDays, 
    preferences = [],
    origin,
    startDate,
    endDate 
  } = req.body;
  
  // ✅ Validation
  if (!destination || !numberOfDays) {
    console.log('❌ Missing required fields');
    return res.status(400).json({ 
      success: false,
      error: 'Destination and numberOfDays are required' 
    });
  }

  console.log('📝 Extracted parameters:', { 
    destination, 
    numberOfDays, 
    preferences,
    origin,
    startDate,
    endDate
  });

  try {
    // ========================================
    // STEP 1: Generate AI Itinerary
    // ========================================
    console.log('🤖 Step 1: Generating AI itinerary...');
    const itineraryText = await generateItinerary({
      destination,
      numberOfDays: parseInt(numberOfDays),
      preferences,
      origin,
      startDate,
      endDate
    });

    console.log('✅ AI itinerary generated successfully');

    // Try to parse as JSON, fallback to text
    let parsedItinerary = itineraryText;
    try {
      parsedItinerary = JSON.parse(itineraryText);
      console.log('✅ AI output successfully parsed as JSON.');
    } catch (e) {
      console.warn("⚠️ AI response is raw text (not JSON)");
    }

    // ========================================
    // STEP 2: Search Flights & Hotels in Parallel
    // ========================================
    console.log('🔍 Step 2: Searching flights and hotels...');
    
    const searchPromises = [];

    // Only search flights if we have origin and dates
    if (origin && startDate && endDate) {
      const flightUrl = new URL(`http://localhost:${process.env.PORT || 5000}/api/flights/search-flights`);
      flightUrl.searchParams.append('origin', origin.trim());
      flightUrl.searchParams.append('destination', destination.trim());
      flightUrl.searchParams.append('departureDate', startDate);
      flightUrl.searchParams.append('returnDate', endDate);
      
      console.log('✈️ Flight search URL:', flightUrl.toString());
      
      searchPromises.push(
        axios.get(flightUrl.toString(), {
          timeout: 20000
        }).catch(err => {
          console.error('❌ Flight search failed:', err.message);
          console.error('   Response:', err.response?.data);
          return { 
            data: { 
              success: false, 
              flights: [], 
              count: 0,
              error: err.message 
            } 
          };
        })
      );
    } else {
      console.log('⚠️ Skipping flight search:', {
        hasOrigin: !!origin,
        hasStartDate: !!startDate,
        hasEndDate: !!endDate
      });
      searchPromises.push(Promise.resolve({ 
        data: { 
          success: false, 
          flights: [], 
          count: 0,
          message: 'Flight search skipped - missing origin or dates' 
        } 
      }));
    }

    // Only search hotels if we have destination and dates
    if (destination && startDate && endDate) {
      // ✅ FIX: Build URL with searchParams to ensure proper encoding
      const hotelUrl = new URL(`http://localhost:${process.env.PORT || 5000}/api/hotels/search-hotels`);
      hotelUrl.searchParams.append('city', destination.trim());
      hotelUrl.searchParams.append('checkInDate', startDate);
      hotelUrl.searchParams.append('checkOutDate', endDate);
      hotelUrl.searchParams.append('adults', '1');
      
      console.log('🏨 Hotel search URL:', hotelUrl.toString());
      
      searchPromises.push(
        axios.get(hotelUrl.toString(), {
          timeout: 20000
        }).catch(err => {
          console.error('❌ Hotel search failed:', err.message);
          console.error('   Response:', err.response?.data);
          return { 
            data: { 
              success: false, 
              hotels: [], 
              count: 0,
              error: err.response?.data?.message || err.message 
            } 
          };
        })
      );
    } else {
      console.log('⚠️ Skipping hotel search:', {
        hasDestination: !!destination,
        hasStartDate: !!startDate,
        hasEndDate: !!endDate
      });
      searchPromises.push(Promise.resolve({ 
        data: { 
          success: false, 
          hotels: [], 
          count: 0,
          message: 'Hotel search skipped - missing destination or dates' 
        } 
      }));
    }

    // Wait for both searches to complete
    const [flightsResponse, hotelsResponse] = await Promise.all(searchPromises);

    console.log('✈️ Flights result:', {
      success: flightsResponse.data.success,
      count: flightsResponse.data.count || 0,
      error: flightsResponse.data.error || null
    });
    console.log('🏨 Hotels result:', {
      success: hotelsResponse.data.success,
      count: hotelsResponse.data.count || 0,
      error: hotelsResponse.data.error || null
    });

    // ========================================
    // STEP 3: Combine Everything
    // ========================================
    const completeItinerary = {
      success: true,
      
      // AI-generated itinerary
      itinerary: parsedItinerary,
      
      // Flight information
      flights: {
        available: flightsResponse.data.success && flightsResponse.data.flights?.length > 0,
        count: flightsResponse.data.count || 0,
        data: flightsResponse.data.flights || [],
        route: flightsResponse.data.route || null,
        error: flightsResponse.data.error || null,
        message: flightsResponse.data.message || null
      },
      
      // Hotel information
      hotels: {
        available: hotelsResponse.data.success && hotelsResponse.data.hotels?.length > 0,
        count: hotelsResponse.data.count || 0,
        data: hotelsResponse.data.hotels || [],
        city: hotelsResponse.data.city || destination,
        cityCode: hotelsResponse.data.cityCode || null,
        error: hotelsResponse.data.error || null,
        message: hotelsResponse.data.message || null
      },

      // Trip metadata
      tripInfo: {
        destination,
        origin: origin || null,
        startDate: startDate || null,
        endDate: endDate || null,
        numberOfDays: parseInt(numberOfDays),
        preferences: preferences
      },

      // Timestamp
      generatedAt: new Date().toISOString()
    };

    console.log('📦 Complete itinerary prepared successfully!');
    console.log('📊 Final Summary:', {
      hasItinerary: !!completeItinerary.itinerary,
      flightsAvailable: completeItinerary.flights.available,
      flightsCount: completeItinerary.flights.count,
      hotelsAvailable: completeItinerary.hotels.available,
      hotelsCount: completeItinerary.hotels.count
    });

    res.json(completeItinerary);

  } catch (err) {
    console.error("❌ Error generating complete itinerary:", err);
    console.error("❌ Error message:", err.message);
    console.error("❌ Error stack:", err.stack);
    
    res.status(500).json({ 
      success: false,
      error: 'Failed to generate complete itinerary',
      message: err.message,
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
});

export default router;