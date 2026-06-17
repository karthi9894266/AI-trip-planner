import React, { useEffect, useState } from 'react';

function FlightInfo() {
  const [flightData, setFlightData] = useState(null);

  useEffect(() => {
    fetch('http://localhost:5000/api/flights/search-flights?origin=DEL&destination=NYC&departureDate=2025-06-10&returnDate=2025-06-20')
      .then(res => res.json())
      .then(data => {
        // If your backend returns the extracted data directly
        setFlightData(data);
      })
      .catch(err => console.error(err));
  }, []);

  if (!flightData) return <div>Loading...</div>;

  return (
    <div>
      <h2>Flight Info</h2>
      <p><strong>Total Price:</strong> {flightData.totalPrice}</p>
      <p><strong>Departure City:</strong> {flightData.departureCity}</p>
      <p><strong>Arrival City:</strong> {flightData.arrivalCity}</p>
    </div>
  );
}

export default FlightInfo;
