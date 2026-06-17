import React, { useState, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function PlanTrip() {
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
    notes: ''
  });

  const { token } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === 'checkbox') {
      setFormData((prev) => {
        const list = prev[name] || [];
        return {
          ...prev,
          [name]: checked ? [...list, value] : list.filter((item) => item !== value)
        };
      });
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(
        'http://localhost:5000/api/trips',
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert('Trip planned!');
      navigate('/');
    } catch (err) {
      alert('Error planning trip: ' + (err.response?.data?.message || err.message));
    }
  };

  return (
    <div className="plan-form">
      <h2>Plan a New Trip</h2>
      <form onSubmit={handleSubmit}>
        <input type="text" name="origin" placeholder="Origin" value={formData.origin} onChange={handleChange} required />
        <input type="text" name="destination" placeholder="Destination" value={formData.destination} onChange={handleChange} required />
        <input type="date" name="startDate" value={formData.startDate} onChange={handleChange} required />
        <input type="date" name="endDate" value={formData.endDate} onChange={handleChange} required />

        <input type="number" name="numberOfDays" placeholder="Number of Days" value={formData.numberOfDays} onChange={handleChange} />

        <select name="groupType" value={formData.groupType} onChange={handleChange}>
          <option value="">Select Group Type</option>
          <option value="Solo">Solo</option>
          <option value="Family">Family</option>
          <option value="Friends">Friends</option>
        </select>

        <label>Preferences:</label>
        {["Nature", "Adventure", "Spiritual", "Mixed"].map((pref) => (
          <label key={pref}><input type="checkbox" name="preferences" value={pref} onChange={handleChange} /> {pref}</label>
        ))}

        <select name="hotelBudget" value={formData.hotelBudget} onChange={handleChange}>
          <option value="">Select Hotel Budget</option>
          <option value="Budget">Budget</option>
          <option value="Mid-range">Mid-range</option>
          <option value="Luxury">Luxury</option>
        </select>

        <label>Hotel Amenities:</label>
        {["AC", "Wi-Fi", "Pool", "Pet-friendly"].map((amenity) => (
          <label key={amenity}><input type="checkbox" name="hotelAmenities" value={amenity} onChange={handleChange} /> {amenity}</label>
        ))}

        <label>Transport Options:</label>
        {["Flight", "Train", "Bus", "Car Rental"].map((transport) => (
          <label key={transport}><input type="checkbox" name="transportOptions" value={transport} onChange={handleChange} /> {transport}</label>
        ))}

        <label>Food Interests:</label>
        {["Vegetarian", "Non-vegetarian", "Street Food", "Fine Dining"].map((food) => (
          <label key={food}><input type="checkbox" name="foodInterests" value={food} onChange={handleChange} /> {food}</label>
        ))}

        <label>Special Requirements:</label>
        {["Kid-friendly", "Pet-friendly", "Elderly Accessible"].map((req) => (
          <label key={req}><input type="checkbox" name="specialRequirements" value={req} onChange={handleChange} /> {req}</label>
        ))}

        <textarea name="notes" placeholder="Additional notes" value={formData.notes} onChange={handleChange}></textarea>

        <button type="submit">Generate Itinerary</button>
      </form>
    </div>
  );
}
