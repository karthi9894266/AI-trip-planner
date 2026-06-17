import React from 'react';

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

const TripCard = ({ trip, onDelete }) => {
  return (
    <div className="trip-card">
      <h3>📍 {trip.destination}</h3>

      <p>
        📅 {new Date(trip.startDate).toLocaleDateString()} — {new Date(trip.endDate).toLocaleDateString()}
      </p>

      {/* Destination clickable link */}
      <p>
        <a
          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(trip.destination)}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          🌍 View Destination on Map
        </a>
      </p>

      {/* Embedded Google Map */}
      {GOOGLE_MAPS_API_KEY && (
        <iframe
          title="Destination Map"
          width="100%"
          height="200"
          frameBorder="0"
          style={{ border: 0, marginBottom: "10px" }}
          src={`https://www.google.com/maps/embed/v1/place?key=${GOOGLE_MAPS_API_KEY}&q=${encodeURIComponent(trip.destination)}`}
          allowFullScreen
        ></iframe>
      )}

      {/* Itinerary */}
      {trip.itinerary && <p>📝 {trip.itinerary}</p>}

      {/* Flight Info */}
      {trip.flight && trip.flight.from && (
        <div className="trip-section">
          <h4>✈️ Flight Info</h4>
          <p><strong>From:</strong> {trip.flight.from}</p>
          <p><strong>To:</strong> {trip.flight.to}</p>
          <p><strong>Price:</strong> ₹{trip.flight.price || 'N/A'}</p>
        </div>
      )}

      {/* Hotel Info */}
      {trip.hotel && trip.hotel.name && (
        <div className="trip-section">
          <h4>🏨 Hotel Info</h4>
          <p><strong>Name:</strong> {trip.hotel.name}</p>
          <p>
            <strong>Address:</strong>{" "}
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(trip.hotel.address)}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              {trip.hotel.address}
            </a>
          </p>
          <p>
            <strong>Price:</strong> ₹{trip.hotel.price}
            {trip.hotel.currency ? ` ${trip.hotel.currency}` : ''}
          </p>
        </div>
      )}

      <button className="btn delete-btn" onClick={() => onDelete(trip._id)}>
        🗑 Delete
      </button>
    </div>
  );
};

export default TripCard;
