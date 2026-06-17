import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './TripPlannerForm.css';

const TripPlannerForm = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    origin: '',
    destination: '',
    startDate: '',
    endDate: '',
    numberOfDays: '',
    groupType: '',
    preferences: [],
    hotelBudget: '',
    hotelAmenities: [],
    transportOptions: [],
    foodInterests: [],
    specialRequirements: [],
    notes: '',
    itinerary: ''
  });

  // Flight and Hotel Search States
  const [flights, setFlights] = useState([]);
  const [hotels, setHotels] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generatingItinerary, setGeneratingItinerary] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('You must be logged in to plan a trip.');
      navigate('/login');
    }
  }, [navigate]);

  useEffect(() => {
    if (formData.startDate && formData.endDate) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);
      const diff = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
      setFormData(prev => ({ ...prev, numberOfDays: diff > 0 ? diff : '' }));
    }
  }, [formData.startDate, formData.endDate]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === 'checkbox') {
      const list = formData[name] || [];
      if (checked) {
        setFormData({ ...formData, [name]: [...list, value] });
      } else {
        setFormData({ ...formData, [name]: list.filter(item => item !== value) });
      }
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  // ✈️ Search Flights Function
  const searchFlights = async () => {
    if (!formData.origin || !formData.destination || !formData.startDate) {
      setSearchError('Please fill in origin, destination, and start date to search for flights.');
      setFlights([]);
      return;
    }

    setSearchLoading(true);
    setSearchError('');
    setHotels([]);

    try {
      const res = await axios.get('http://localhost:5000/api/flights/search-flights', {
        params: {
          origin: formData.origin,
          destination: formData.destination,
          departureDate: formData.startDate,
          returnDate: formData.endDate || undefined
        }
      });

      setFlights(res.data);
      console.log('✅ Flights fetched:', res.data);
    } catch (err) {
      console.error('❌ Failed to fetch flights:', err);
      setSearchError(err.response?.data?.message || 'Failed to fetch flights');
    } finally {
      setSearchLoading(false);
    }
  };

  // 🏨 Search Hotels Function
  const searchHotels = async () => {
    if (!formData.destination || !formData.startDate || !formData.endDate) {
      setSearchError('Please fill in destination, start date, and end date to search for hotels.');
      setHotels([]);
      return;
    }

    setSearchLoading(true);
    setSearchError('');
    setFlights([]);

    try {
      const res = await axios.get('http://localhost:5000/api/hotels/search-hotels', {
        params: {
          city: formData.destination,
          checkIn: formData.startDate,
          checkOut: formData.endDate
        }
      });

      setHotels(res.data);
      console.log('✅ Hotels fetched:', res.data);
    } catch (err) {
      console.error('❌ Failed to fetch hotels:', err);
      setSearchError(err.response?.data?.message || 'Hotel search not implemented yet on backend');
    } finally {
      setSearchLoading(false);
    }
  };

  const handleGenerateItinerary = async () => {
    if (!formData.origin || !formData.destination || !formData.startDate || !formData.endDate) {
      alert('Please fill in origin, destination, and dates first.');
      return;
    }

    try {
      setGeneratingItinerary(true);
      const token = localStorage.getItem('token');

      const res = await axios.post(
        'http://localhost:5000/api/trips/generate-itinerary',
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setFormData(prev => ({ ...prev, itinerary: res.data.itinerary }));
    } catch (err) {
      console.error('Failed to generate itinerary:', err);
      alert('Failed to generate itinerary. Try again.');
    } finally {
      setGeneratingItinerary(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (!formData.itinerary) {
      alert('Please generate the itinerary first.');
      setIsSubmitting(false);
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      alert('You must be logged in to save a trip.');
      setIsSubmitting(false);
      return;
    }

    try {
      await axios.post('http://localhost:5000/api/trips', formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      alert('✅ Trip saved successfully!');
      navigate('/dashboard');
    } catch (error) {
      console.error('Error saving trip:', error.response?.data || error.message);
      alert('❌ Failed to save trip');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="trip-planner">
      <div className="overlay"></div>
      <div className="header">
        <div className="header-text">
          <h1>Plan Your Perfect Trip</h1>
          <p>Create personalized travel itineraries tailored to your preferences</p>
          <div className="features">
            <span>📍 Discover Places</span>
            <span>📅 Plan Dates</span>
            <span>👥 Group Travel</span>
            <span>✈️ Book Transport</span>
          </div>
        </div>
      </div>

      {/* Form Section */}
      <form className="form-container" onSubmit={handleSubmit}>
        {/* Trip Basics */}
        <div className="section section-blue">
          <h2>Trip Basics</h2>

          <label>Origin City *</label>
          <input type="text" name="origin" value={formData.origin} onChange={handleChange} required />

          <label>Destination *</label>
          <input type="text" name="destination" value={formData.destination} onChange={handleChange} required />

          <label>Start Date *</label>
          <input type="date" name="startDate" value={formData.startDate} onChange={handleChange} required />

          <label>End Date *</label>
          <input type="date" name="endDate" value={formData.endDate} onChange={handleChange} required />

          <label>Number of Days</label>
          <input type="number" name="numberOfDays" value={formData.numberOfDays} onChange={handleChange} placeholder="e.g., 5" readOnly />

          <label>Group Type</label>
          <select name="groupType" value={formData.groupType} onChange={handleChange}>
            <option value="">Select group type</option>
            <option value="Solo">Solo</option>
            <option value="Family">Family</option>
            <option value="Friends">Friends</option>
          </select>
        </div>

        {/* ✈️🏨 NEW: Flight & Hotel Search Section */}
        <div className="section section-teal">
          <h2>✈️ Search Flights & Hotels</h2>
          
          <div className="search-buttons">
            <button type="button" onClick={searchFlights} disabled={searchLoading} className="search-btn flight-btn">
              {searchLoading ? '⏳ Searching...' : '✈️ Search Flights'}
            </button>
            
            <button type="button" onClick={searchHotels} disabled={searchLoading} className="search-btn hotel-btn">
              {searchLoading ? '⏳ Searching...' : '🏨 Search Hotels'}
            </button>
          </div>

          {searchError && (
            <div className="error-message">
              ⚠️ {searchError}
            </div>
          )}

          {/* Flight Results */}
          {flights.length > 0 && (
            <div className="results-section">
              <h3>✈️ Available Flights ({flights.length})</h3>
              <div className="results-grid">
                {flights.map((flight, index) => (
                  <div key={index} className="result-card flight-card">
                    <p><strong>From:</strong> {flight.departureCity}</p>
                    <p><strong>To:</strong> {flight.arrivalCity}</p>
                    <p className="price"><strong>Price:</strong> ${flight.totalPrice}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Hotel Results */}
          {hotels.length > 0 && (
            <div className="results-section">
              <h3>🏨 Available Hotels ({hotels.length})</h3>
              <div className="results-grid">
                {hotels.map((hotel, index) => (
                  <div key={index} className="result-card hotel-card">
                    <p><strong>Hotel:</strong> {hotel.name}</p>
                    <p className="price"><strong>Price:</strong> ${hotel.price}/night</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Preferences */}
        <div className="section section-green">
          <h2>Your Preferences</h2>
          <label>Preferred Type of Places</label>
          <div className="checkbox-grid">
            {["Nature", "Adventure", "Spiritual", "Mixed", "Historical", "Shopping", "Romantic"].map(item => (
              <label key={item}>
                <input type="checkbox" name="preferences" value={item} onChange={handleChange} /> {item}
              </label>
            ))}
          </div>

          <label>Hotel Budget</label>
          <select name="hotelBudget" value={formData.hotelBudget} onChange={handleChange}>
            <option value="">Select budget range</option>
            <option value="Budget">Budget</option>
            <option value="Mid-range">Mid-range</option>
            <option value="Luxury">Luxury</option>
          </select>

          <label>Hotel Amenities</label>
          <div className="checkbox-grid">
            {["AC", "Breakfast", "Wi-Fi", "Swimming Pool", "Pet-friendly"].map(item => (
              <label key={item}>
                <input type="checkbox" name="hotelAmenities" value={item} onChange={handleChange} /> {item}
              </label>
            ))}
          </div>
        </div>

        {/* Transport & Food */}
        <div className="section section-purple">
          <h2>Transport & Food</h2>
          <label>Transport Options</label>
          <div className="checkbox-grid">
            {["Flight", "Train", "Bus", "Car Rental", "Bike Rental"].map(item => (
              <label key={item}>
                <input type="checkbox" name="transportOptions" value={item} onChange={handleChange} /> {item}
              </label>
            ))}
          </div>

          <label>Food Interests</label>
          <div className="checkbox-grid">
            {["Local cuisine", "Vegetarian", "Non-vegetarian", "Street food", "Fine dining"].map(item => (
              <label key={item}>
                <input type="checkbox" name="foodInterests" value={item} onChange={handleChange} /> {item}
              </label>
            ))}
          </div>
        </div>

        {/* Special Requirements */}
        <div className="section section-orange">
          <h2>Special Requirements</h2>
          <label>Accessibility & Special Needs</label>
          <div className="checkbox-grid">
            {["Kid-friendly", "Pet friendly", "Elderly accessible", "Wheelchair accessible"].map(item => (
              <label key={item}>
                <input type="checkbox" name="specialRequirements" value={item} onChange={handleChange} /> {item}
              </label>
            ))}
          </div>

          <label>Additional Notes</label>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            placeholder="Any specific requests or preferences..."
          />
        </div>

        {/* AI Itinerary Button & Preview */}
        <div className="form-footer">
          <button type="button" onClick={handleGenerateItinerary} disabled={generatingItinerary}>
            {generatingItinerary ? 'Generating...' : 'Generate AI Itinerary'}
          </button>

          {formData.itinerary && (
            <div className="itinerary-preview">
              <h3>🧠 AI Itinerary Preview</h3>
              <pre>{formData.itinerary}</pre>
            </div>
          )}
        </div>

        <div className="form-footer">
          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Save Trip'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default TripPlannerForm;

