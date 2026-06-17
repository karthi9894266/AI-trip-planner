import React, { useEffect } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

export default function MapView({ trips }) {
  useEffect(() => {
    const mapContainer = document.getElementById('map');
    if (!mapContainer) return;

    if (mapContainer._leaflet_id) {
      mapContainer._leaflet_id = null;
    }

    const map = L.map('map').setView([20.5937, 78.9629], 4);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
    }).addTo(map);

    // 📍 User location marker
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          L.marker([latitude, longitude])
            .addTo(map)
            .bindPopup('You are here!')
            .openPopup();
          map.setView([latitude, longitude], 10);
        },
        () => console.warn('Location access denied.')
      );
    }

    // 🏨 Hotel markers from trips
    trips?.forEach((trip) => {
      if (trip.hotel?.latitude && trip.hotel?.longitude) {
        L.marker([trip.hotel.latitude, trip.hotel.longitude])
          .addTo(map)
          .bindPopup(`<b>${trip.hotel.hotelName}</b><br/>${trip.hotel.address}`);
      }
    });

    return () => {
      map.remove();
    };
  }, [trips]);

  return <div id="map" style={{ height: '300px', marginTop: '1rem' }}></div>;
}

