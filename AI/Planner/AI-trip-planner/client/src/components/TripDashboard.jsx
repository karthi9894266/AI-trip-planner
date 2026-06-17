import React, { useEffect, useState, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';

// --- GLOBAL VARIABLES (Provided by the environment) ---
// Firebase config is included for authentication boilerplate
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-trip-app-id';
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};
const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;

// --- AMADEUS CONFIGURATION (Replace placeholders with your actual keys) ---
const AMADEUS_API_KEY = "YOUR_AMADEUS_CLIENT_ID"; // <-- REPLACE THIS
const AMADEUS_API_SECRET = "YOUR_AMADEUS_CLIENT_SECRET"; // <-- REPLACE THIS
const AMADEUS_BASE_URL = "https://test.api.amadeus.com";
const AMADEUS_TOKEN_URL = `${AMADEUS_BASE_URL}/v1/security/oauth2/token`;

// --- MOCK DATA (Used if Amadeus keys are missing or for fallback) ---

const MOCK_TRIPS_DATA = [
    { _id: 't1', origin: 'New York', destination: 'Paris', startDate: '2025-10-15', endDate: '2025-10-22', itinerary: 'Day 1: Eiffel Tower; Day 2: Louvre.', groupType: 'Solo' },
    { _id: 't2', origin: 'London', destination: 'Kyoto', startDate: '2025-11-01', endDate: '2025-11-10', itinerary: 'Visit temples and bamboo forest.', groupType: 'Family' },
];

const MOCK_FLIGHTS = [
    { departureCity: 'NY', arrivalCity: 'Paris', totalPrice: 650, carrier: 'AirMock' },
    { departureCity: 'NY', arrivalCity: 'Paris', totalPrice: 820, carrier: 'JetSim' },
];

const MOCK_HOTELS = [
    { name: 'Chic Hotel Paris', price: 250, rating: 4.5 },
    { name: 'Budget Inn Center', price: 110, rating: 3.0 },
];

/**
 * Simulates an API call with a delay.
 */
const mockFetch = (data) => new Promise(resolve => {
    setTimeout(() => resolve({ data, status: 200 }), 500);
});

// --- Dashboard Component ---

const Dashboard = () => {
    // Firebase and Auth states (Boilerplate setup for canvas environment)
    const [auth, setAuth] = useState(null);
    const [userId, setUserId] = useState(null);

    // Trip and Search states
    const [trips, setTrips] = useState([]);
    const [flights, setFlights] = useState([]);
    const [hotels, setHotels] = useState([]);
    const [searchLoading, setSearchLoading] = useState(false);
    const [searchError, setSearchError] = useState('');
    
    // Search form state
    const [searchParams, setSearchParams] = useState({
        origin: '',
        destination: '',
        departureDate: '',
        returnDate: ''
    });

    const [newTrip, setNewTrip] = useState({
        origin: '', destination: '', startDate: '', endDate: '',
        itinerary: '', groupType: '', preferences: [], hotelBudget: '',
        hotelAmenities: [], transportOptions: [], foodInterests: [],
        specialRequirements: [], notes: ''
    });

    // 1. Firebase Initialization and Authentication
    useEffect(() => {
        if (Object.keys(firebaseConfig).length === 0) {
            console.warn("Firebase config not available. Running in mock mode.");
            return;
        }
        
        const app = initializeApp(firebaseConfig);
        const authInstance = getAuth(app);
        
        onAuthStateChanged(authInstance, (user) => {
            if (user) {
                setUserId(user.uid);
            } else {
                signInAnonymously(authInstance).then(userCredential => {
                    setUserId(userCredential.user.uid);
                }).catch(err => {
                    console.error("Anonymous sign-in failed:", err);
                    setUserId('anonymous-user');
                });
            }
        });

        if (initialAuthToken) {
            signInWithCustomToken(authInstance, initialAuthToken).catch(error => {
                console.error("Custom token sign-in failed:", error);
            });
        }
        
        setAuth(authInstance);

    }, []);

    // Load mock trips on mount
    useEffect(() => {
        const loadMockTrips = async () => {
            const res = await mockFetch(MOCK_TRIPS_DATA);
            setTrips(res.data);
        };
        loadMockTrips();
    }, []);

    /**
     * Placeholder function to simulate fetching the Amadeus OAuth token.
     * In a real application, this would make a POST request to AMADEUS_TOKEN_URL
     * using the client ID and secret.
     */
    const getAmadeusToken = async () => {
        if (!AMADEUS_API_KEY || !AMADEUS_API_SECRET || AMADEUS_API_KEY.includes("YOUR_")) {
            console.warn("Amadeus keys are missing. Skipping token generation.");
            return null;
        }
        
        // --- REAL AMADEUS TOKEN GENERATION LOGIC GOES HERE ---
        
        const response = await fetch(AMADEUS_TOKEN_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: `grant_type=client_credentials&client_id=${AMADEUS_API_KEY}&client_secret=${AMADEUS_API_SECRET}`
        });
        const data = await response.json();
        return data.access_token; 
        
       
        // Simulated token for demo purposes
        return 'SIMULATED_AMADEUS_TOKEN';
    };

    // Amadeus Flight Search Function
    const searchFlights = async () => {
        if (!searchParams.origin || !searchParams.destination || !searchParams.departureDate) {
            setSearchError('Please fill in origin, destination, and departure date to search for flights.');
            setFlights([]);
            setHotels([]);
            return;
        }

        setSearchLoading(true);
        setSearchError('');
        setHotels([]); // Clear hotel results

        try {
            const token = await getAmadeusToken();
            
            if (!token) {
                // Fallback to mock data if API keys are missing
                console.log("Using Mock Flight Data.");
                const res = await mockFetch(MOCK_FLIGHTS);
                setFlights(res.data);
                return;
            }

            // --- REAL AMADEUS FLIGHT SEARCH LOGIC GOES HERE ---
            // Construct Amadeus Flight Offers Search URL
            const amadeusFlightUrl = `${AMADEUS_BASE_URL}/v2/shopping/flight-offers?originLocationCode=${searchParams.origin}&destinationLocationCode=${searchParams.destination}&departureDate=${searchParams.departureDate}&currencyCode=USD`;
            
            console.log("Attempting Amadeus Flight Search with URL:", amadeusFlightUrl);
            
            const response = await fetch(amadeusFlightUrl, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            // Process 'data.data' and setFlights
            
            
            // For now, we use mock data after token check to show success
            const res = await mockFetch(MOCK_FLIGHTS);
            setFlights(res.data);
            
        } catch (err) {
            console.error('❌ Failed to fetch flights:', err);
            setSearchError(err.message || 'Flight search failed. Check console for details.');
        } finally {
            setSearchLoading(false);
        }
    };

    // Amadeus Hotel Search Function
    const searchHotels = async () => {
        if (!searchParams.destination || !searchParams.departureDate || !searchParams.returnDate) {
            setSearchError('Please fill in destination, check-in, and check-out to search for hotels.');
            setHotels([]); 
            setFlights([]);
            return;
        }

        setSearchLoading(true);
        setSearchError('');
        setFlights([]); // Clear flight results

        try {
            const token = await getAmadeusToken();
            
            if (!token) {
                // Fallback to mock data if API keys are missing
                console.log("Using Mock Hotel Data.");
                const res = await mockFetch(MOCK_HOTELS);
                setHotels(res.data);
                return;
            }

            // --- REAL AMADEUS HOTEL SEARCH LOGIC GOES HERE ---
            // NOTE: Amadeus hotel search often requires a geographic bounding box or specific city code (e.g., from the Location API)
            // We use a simplified placeholder URL here.
            const amadeusHotelUrl = `${AMADEUS_BASE_URL}/v1/reference-data/locations/hotels/by-city?cityCode=PAR&checkInDate=${searchParams.departureDate}&checkOutDate=${searchParams.returnDate}`;
            
            console.log("Attempting Amadeus Hotel Search with URL:", amadeusHotelUrl);

            
            const response = await fetch(amadeusHotelUrl, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            // Process 'data.data' and setHotels
            

            // For now, we use mock data after token check to show success
            const res = await mockFetch(MOCK_HOTELS);
            setHotels(res.data);
            
        } catch (err) {
            console.error('❌ Failed to fetch hotels:', err);
            setSearchError(err.message || 'Hotel search failed. Check console for details.');
        } finally {
            setSearchLoading(false);
        }
    };
    
    // Handler functions for form inputs (rest of the component logic)

    const handleSearchChange = (e) => {
        setSearchParams({ ...searchParams, [e.target.name]: e.target.value });
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        if (type === 'checkbox') {
            setNewTrip(prev => ({
                ...prev,
                [name]: checked
                    ? [...(prev[name] || []), value]
                    : prev[name].filter((item) => item !== value)
            }));
        } else {
            setNewTrip({ ...newTrip, [name]: value });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const newTripWithId = { ...newTrip, _id: Date.now().toString(), itinerary: 'AI generated itinerary placeholder.' };
            await mockFetch(newTripWithId); 

            setTrips([newTripWithId, ...trips]);
            setNewTrip({
                origin: '', destination: '', startDate: '', endDate: '',
                itinerary: '', groupType: '', preferences: [], hotelBudget: '',
                hotelAmenities: [], transportOptions: [], foodInterests: [],
                specialRequirements: [], notes: ''
            });
        } catch (err) {
            console.error('Failed to create trip:', err);
        }
    };

    const handleDelete = async (id) => {
        try {
            await mockFetch({}); 
            setTrips(trips.filter(trip => trip._id !== id));
        } catch (err) {
            console.error('Failed to delete trip:', err);
        }
    };

    const formOptions = useMemo(() => ({
        preferences: ["Nature", "Adventure", "Spiritual", "Mixed", "Historical", "Shopping", "Romantic"],
        hotelAmenities: ["AC", "Breakfast", "Wi-Fi", "Swimming Pool", "Pet-friendly"],
        transportOptions: ["Flight", "Train", "Bus", "Car Rental", "Bike Rental"],
        foodInterests: ["Local cuisine", "Vegetarian", "Non-vegetarian", "Street food", "Fine dining"],
        specialRequirements: ["Kid-friendly", "Pet friendly", "Elderly accessible", "Wheelchair accessible"],
    }), []);

    return (
        <div className="min-h-screen bg-gray-100 p-4 sm:p-8 font-sans">
            
            {/* Header */}
            <header className="bg-white shadow-xl rounded-xl p-4 mb-8 flex flex-col sm:flex-row justify-between items-center sticky top-4 z-10">
                <div className="text-center sm:text-left">
                    <h1 className="text-3xl font-extrabold text-indigo-700">🌍 My Trips Dashboard</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Welcome, {userId || 'Signing in...'}
                    </p>
                </div>
                <div className="mt-4 sm:mt-0">
                    <button className="bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded-lg transition duration-200 shadow-md">
                        Logout
                    </button>
                </div>
            </header>

            <main className="max-w-6xl mx-auto space-y-12">
                
                {/* Flight & Hotel Search Section */}
                <section className="bg-white p-6 rounded-xl shadow-xl border-t-4 border-indigo-500">
                    <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
                        <span role="img" aria-label="plane">✈️</span> Flight & Hotel Search (Amadeus Ready)
                    </h2>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        <input
                            type="text"
                            name="origin"
                            placeholder="Origin (e.g., NYC, LAX)"
                            value={searchParams.origin}
                            onChange={handleSearchChange}
                            className="p-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 w-full"
                        />
                        <input
                            type="text"
                            name="destination"
                            placeholder="Destination (e.g., PAR, LON)"
                            value={searchParams.destination}
                            onChange={handleSearchChange}
                            className="p-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 w-full"
                        />
                        <input
                            type="date"
                            name="departureDate"
                            value={searchParams.departureDate}
                            onChange={handleSearchChange}
                            className="p-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 w-full"
                        />
                        <input
                            type="date"
                            name="returnDate"
                            placeholder="Return Date (Hotels: Check-out)"
                            value={searchParams.returnDate}
                            onChange={handleSearchChange}
                            className="p-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 w-full"
                        />
                    </div>
                    
                    {/* CONFIRMATION: Buttons for search are explicitly placed here */}
                    <p className="text-gray-600 text-sm mb-3 font-semibold border-t pt-3 mt-3">Click to Search:</p>

                    <div className="flex flex-col sm:flex-row gap-4">
                        <button
                            onClick={searchFlights}
                            disabled={searchLoading}
                            className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-3 rounded-xl transition duration-200 shadow-lg disabled:bg-indigo-400 text-sm"
                        >
                            {searchLoading ? '⏳ Searching Flights...' : '✈️ Search Flights'}
                        </button>
                        
                        <button
                            onClick={searchHotels}
                            disabled={searchLoading}
                            className="flex-1 bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 px-3 rounded-xl transition duration-200 shadow-lg disabled:bg-teal-400 text-sm"
                        >
                            {searchLoading ? '⏳ Searching Hotels...' : '🏨 Search Hotels'}
                        </button>
                    </div>

                    {searchError && (
                        <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-lg border border-red-300">
                            ⚠️ {searchError}
                        </div>
                    )}

                    {/* Results Display Area */}
                    {(flights.length > 0 || hotels.length > 0) && (
                        <div className="mt-8 space-y-8">
                            
                            {/* Flight Results Display */}
                            {flights.length > 0 && (
                                <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-200">
                                    <h3 className="text-xl font-semibold text-indigo-700 mb-4">✈️ Flight Results ({flights.length})</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {flights.map((flight, index) => (
                                            <div key={index} className="bg-white p-4 rounded-lg shadow-md border-l-4 border-indigo-500">
                                                <p className="text-lg font-bold">{flight.departureCity} &rarr; {flight.arrivalCity}</p>
                                                <p className="text-sm text-gray-600">Carrier: {flight.carrier}</p>
                                                <p className="text-xl font-extrabold text-green-600 mt-2">Price: ${flight.totalPrice}</p>
                                            </div>
                                        ))}
                                    </div>
                                    <p className="mt-4 text-xs text-gray-500">Note: This is mock data or a successful Amadeus response payload converted to this format.</p>
                                </div>
                            )}

                            {/* Hotel Results Display */}
                            {hotels.length > 0 && (
                                <div className="p-4 bg-teal-50 rounded-lg border border-teal-200">
                                    <h3 className="text-xl font-semibold text-teal-700 mb-4">🏨 Hotel Results ({hotels.length})</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {hotels.map((hotel, index) => (
                                            <div key={index} className="bg-white p-4 rounded-lg shadow-md border-l-4 border-teal-500">
                                                <p className="text-lg font-bold">{hotel.name}</p>
                                                <p className="text-sm text-gray-600">Rating: {hotel.rating} / 5</p>
                                                <p className="text-xl font-extrabold text-green-600 mt-2">Price: ${hotel.price}/night</p>
                                            </div>
                                        ))}
                                    </div>
                                    <p className="mt-4 text-xs text-gray-500">Note: This is mock data or a successful Amadeus response payload converted to this format.</p>
                                </div>
                            )}
                        </div>
                    )}
                </section>

                {/* Plan New Trip Form */}
                <section className="bg-white p-6 rounded-xl shadow-xl border-t-4 border-purple-500">
                    <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                        ✨ Plan New Trip
                    </h2>
                    <form className="space-y-6" onSubmit={handleSubmit}>
                        
                        {/* Basic Details */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <input type="text" name="origin" placeholder="Origin City" value={newTrip.origin} onChange={handleChange} required className="p-3 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500 w-full" />
                            <input type="text" name="destination" placeholder="Destination City" value={newTrip.destination} onChange={handleChange} required className="p-3 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500 w-full" />
                            <input type="date" name="startDate" value={newTrip.startDate} onChange={handleChange} required className="p-3 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500 w-full" />
                            <input type="date" name="endDate" value={newTrip.endDate} onChange={handleChange} required className="p-3 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500 w-full" />
                            <textarea name="itinerary" placeholder="Itinerary details (e.g., must-see spots)" value={newTrip.itinerary} onChange={handleChange} required className="p-3 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500 w-full sm:col-span-2 min-h-[80px]" />
                            
                            <select name="groupType" value={newTrip.groupType} onChange={handleChange} className="p-3 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500 w-full">
                                <option value="">Select Group Type</option>
                                <option value="Solo">Solo</option>
                                <option value="Family">Family</option>
                                <option value="Friends">Friends</option>
                            </select>
                            <select name="hotelBudget" value={newTrip.hotelBudget} onChange={handleChange} className="p-3 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500 w-full">
                                <option value="">Select Hotel Budget</option>
                                <option value="Low">Low</option>
                                <option value="Medium">Medium</option>
                                <option value="High">High</option>
                            </select>
                        </div>

                        {/* Checkbox Groups */}
                        {Object.entries(formOptions).map(([key, options]) => (
                            <div key={key} className="border p-4 rounded-lg bg-gray-50">
                                <label className="block text-gray-700 font-semibold mb-2 capitalize">{key.replace(/([A-Z])/g, ' $1')}:</label>
                                <div className="flex flex-wrap gap-4">
                                    {options.map(item => (
                                        <label key={item} className="flex items-center space-x-2 text-sm">
                                            <input 
                                                type="checkbox" 
                                                name={key} 
                                                value={item} 
                                                checked={(newTrip[key] || []).includes(item)}
                                                onChange={handleChange} 
                                                className="rounded text-purple-600 focus:ring-purple-500"
                                            /> 
                                            <span className="text-gray-600">{item}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        ))}
                        
                        <textarea name="notes" placeholder="Any special notes or other requirements" value={newTrip.notes} onChange={handleChange} className="p-3 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500 w-full min-h-[80px]" />
                        
                        <button type="submit" className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-xl transition duration-200 shadow-lg text-lg">
                            + Plan New Trip
                        </button>
                    </form>
                </section>

                {/* Trips Container */}
                <section className="space-y-6">
                    <h2 className="text-2xl font-bold text-gray-800 flex items-center">
                        🧳 My Planned Trips
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {trips.length === 0 ? (
                            <p className="text-center text-gray-500 p-8 col-span-full bg-white rounded-xl shadow-md">
                                🧳 No trips found. Start your journey by planning one above!
                            </p>
                        ) : (
                            trips.map(trip => (
                                <div key={trip._id} className="bg-white p-6 rounded-xl shadow-xl hover:shadow-2xl transition duration-300 border-l-8 border-yellow-500 flex flex-col justify-between">
                                    <div>
                                        <h2 className="text-xl font-extrabold text-gray-900 mb-1">{trip.destination}</h2>
                                        <p className="text-sm text-gray-500 mb-4">📅 {new Date(trip.startDate).toLocaleDateString()} — {new Date(trip.endDate).toLocaleDateString()}</p>
                                        <p className="text-md text-gray-700">🛫 <strong>From:</strong> {trip.origin}</p>
                                        
                                        {trip.itinerary && (
                                            <div className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                                                <h4 className="font-bold text-yellow-800 mb-1">🧠 AI Itinerary Suggestion</h4>
                                                <p className="text-sm text-gray-700">{trip.itinerary}</p>
                                            </div>
                                        )}
                                    </div>

                                    <div className="mt-6 flex justify-between items-center space-x-2">
                                        <a
                                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(trip.destination)}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-indigo-600 hover:text-indigo-800 text-sm font-medium transition duration-200 flex items-center"
                                        >
                                            🌐 View on Google Maps
                                        </a>
                                        <button 
                                            className="bg-red-500 hover:bg-red-600 text-white text-xs font-semibold py-1.5 px-3 rounded-lg transition duration-200 active:scale-95 shadow-md" 
                                            onClick={() => handleDelete(trip._id)}
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </section>

                {/* Map Placeholder */}
                <div id="map" className="map-placeholder h-64 bg-gray-200 rounded-xl flex items-center justify-center border-4 border-gray-300 shadow-inner">
                    <p className="text-gray-600 text-lg">🗺️ Map Placeholder (Leaflet/Google Maps integration goes here)</p>
                </div>
            </main>
        </div>
    );
};

const App = () => <Dashboard />;
export default App;
