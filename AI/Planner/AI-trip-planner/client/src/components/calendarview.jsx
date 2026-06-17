import React from 'react'
import './CalendarView.css'

export default function CalendarView({ trips }) {
  return (
    <div className="calendar-view">
      <h3>Trip Calendar</h3>
      <div className="calendar-grid">
        {trips.map((trip, i) => (
          <div key={i} className="calendar-card">
            <strong>{trip.destination}</strong><br />
            {new Date(trip.startDate).toLocaleDateString()} — {new Date(trip.endDate).toLocaleDateString()}
          </div>
        ))}
      </div>
    </div>
  )
}
