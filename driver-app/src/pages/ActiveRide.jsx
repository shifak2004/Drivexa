import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useSocket } from '../context/SocketContext';
import useGeolocation from '../hooks/useGeolocation';
import { FaMapMarkerAlt, FaRoute, FaArrowLeft, FaPhone, FaCheckCircle } from 'react-icons/fa';
import L from 'leaflet';
import './ActiveRide.css';

// Fix Leaflet icons
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

const pulsingDriverHtml = `
  <div class="driver-marker-pulsing active-tracking">
    <div class="driver-marker-dot"></div>
    <div class="driver-marker-ring"></div>
  </div>
`;
const driverPosIcon = L.divIcon({
  html: pulsingDriverHtml,
  className: 'driver-custom-pos-marker',
  iconSize: [24, 24],
  iconAnchor: [12, 12]
});

const ActiveRide = () => {
  const { id } = useParams();
  const socket = useSocket();
  const navigate = useNavigate();
  const { location: geoLoc } = useGeolocation();

  const [ride, setRide] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const mapRef = useRef(null);
  const leafletMap = useRef(null);
  const driverMarker = useRef(null);
  const pickupMarker = useRef(null);
  const destMarker = useRef(null);
  const routePolyline = useRef(null);

  // Fetch ride details on mount
  useEffect(() => {
    const fetchRide = async () => {
      try {
        const response = await api.get(`/rides/${id}`);
        setRide(response.data.ride);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching ride:', err);
        setError('Failed to load ride details.');
        setLoading(false);
      }
    };
    fetchRide();
  }, [id]);

  // Set up socket listener for rider cancellations
  useEffect(() => {
    if (!socket) return;

    socket.on('ride-status-update', (data) => {
      const updatedRide = data.ride || data.rideData;
      if (!updatedRide) return;
      if (updatedRide._id === id) {
        setRide(updatedRide);
        if (updatedRide.status === 'cancelled') {
          alert('This ride was cancelled by the rider.');
          navigate('/dashboard');
        }
      }
    });

    return () => {
      socket.off('ride-status-update');
    };
  }, [socket, id, navigate]);

  // Broadcast driver position when active and moving
  useEffect(() => {
    if (geoLoc && ride && ['accepted', 'ongoing'].includes(ride.status)) {
      // Broadcast via socket
      if (socket) {
        socket.emit('driver-location-update', {
          driverId: ride.driver?._id || ride.driver?.id || ride.driver,
          riderId: ride.rider?._id || ride.rider?.id || ride.rider,
          coordinates: [geoLoc.lng, geoLoc.lat]
        });
      }

      // Update local marker on map
      if (driverMarker.current) {
        driverMarker.current.setLatLng([geoLoc.lat, geoLoc.lng]);
      }
    }
  }, [geoLoc, ride, socket]);

  // Initialize Map
  useEffect(() => {
    if (ride && mapRef.current && !leafletMap.current) {
      const pCoords = [ride.pickup.coordinates[1], ride.pickup.coordinates[0]];
      const dCoords = [ride.destination.coordinates[1], ride.destination.coordinates[0]];

      leafletMap.current = L.map(mapRef.current, {
        zoomControl: false,
      }).setView(pCoords, 14);

      L.control.zoom({ position: 'bottomright' }).addTo(leafletMap.current);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
      }).addTo(leafletMap.current);

      // Pickup Marker
      pickupMarker.current = L.marker(pCoords, {
        icon: L.icon({
          iconUrl: icon,
          shadowUrl: iconShadow,
          iconSize: [25, 41],
          iconAnchor: [12, 41],
        })
      }).addTo(leafletMap.current).bindPopup('Pickup: ' + ride.rider?.name);

      // Destination Marker
      destMarker.current = L.marker(dCoords, {
        icon: L.icon({
          iconUrl: icon,
          shadowUrl: iconShadow,
          iconSize: [25, 41],
          iconAnchor: [12, 41],
        })
      }).addTo(leafletMap.current).bindPopup('Destination');

      // Polyline route path
      routePolyline.current = L.polyline([pCoords, dCoords], {
        color: '#10b981',
        weight: 4,
        opacity: 0.8,
        dashArray: '8, 8',
      }).addTo(leafletMap.current);

      const bounds = L.latLngBounds([pCoords, dCoords]);
      leafletMap.current.fitBounds(bounds, { padding: [50, 50] });

      // Add Driver Marker
      const initialDriverCoords = geoLoc ? [geoLoc.lat, geoLoc.lng] : pCoords;
      driverMarker.current = L.marker(initialDriverCoords, { icon: driverPosIcon }).addTo(leafletMap.current);
    }
  }, [ride]);

  const handleUpdateStatus = async (newStatus) => {
    try {
      const response = await api.patch(`/rides/${id}/status`, { status: newStatus });
      const updatedRide = response.data.ride;
      setRide(updatedRide);

      if (socket) {
        socket.emit('ride-status-update', { ride: updatedRide });
      }

      if (newStatus === 'completed') {
        alert('Job completed successfully!');
        navigate('/dashboard');
      }
    } catch (err) {
      console.error('Update ride status error:', err);
      alert('Could not update status.');
    }
  };

  const getStatusStepClass = (step) => {
    const statusOrder = ['accepted', 'ongoing', 'completed'];
    const currentIdx = statusOrder.indexOf(ride?.status);
    const stepIdx = statusOrder.indexOf(step);

    if (stepIdx < currentIdx) return 'step completed';
    if (stepIdx === currentIdx) return 'step active';
    return 'step pending';
  };

  if (loading) {
    return (
      <div className="active-loading">
        <div className="spinner"></div>
      </div>
    );
  }

  if (error || !ride) {
    return (
      <div className="active-error">
        <p>{error || 'Active ride not found.'}</p>
        <button onClick={() => navigate('/dashboard')} className="btn-primary">Go to Dashboard</button>
      </div>
    );
  }

  return (
    <div className="active-ride-page animate-fadeIn">
      <div className="active-ride-container">
        <div className="active-ride-header">
          <button onClick={() => navigate('/dashboard')} className="btn-back">
            <FaArrowLeft /> Dashboard
          </button>
          <h2>Navigation & Progress</h2>
        </div>

        {/* Stepper progress */}
        <div className="status-stepper glass-card">
          <div className={getStatusStepClass('accepted')}>
            <div className="step-number">1</div>
            <div className="step-label">Accepted</div>
          </div>
          <div className="step-divider"></div>
          <div className={getStatusStepClass('ongoing')}>
            <div className="step-number">2</div>
            <div className="step-label">Ongoing</div>
          </div>
          <div className="step-divider"></div>
          <div className={getStatusStepClass('completed')}>
            <div className="step-number">3</div>
            <div className="step-label">Completed</div>
          </div>
        </div>

        <div className="active-ride-content">
          {/* Info Card */}
          <div className="info-panel glass-card">
            <div className="ride-meta-info">
              <span className="badge badge-ongoing">Status: {ride.status}</span>
              <span className="fare-tag">₹{ride.fare}</span>
            </div>

            <div className="passenger-profile glass-card">
              <h4>Passenger Details</h4>
              <div className="passenger-profile-row">
                <div className="avatar-small">👤</div>
                <div className="passenger-desc">
                  <p className="passenger-name">{ride.rider?.name}</p>
                  <p className="passenger-phone"><FaPhone /> {ride.rider?.phone}</p>
                </div>
              </div>
            </div>

            <div className="locations-tracking">
              <div className="loc-group">
                <FaMapMarkerAlt className="loc-icon green" />
                <div className="loc-details">
                  <span className="loc-lbl">Pickup</span>
                  <p className="loc-txt">{ride.pickup.address}</p>
                </div>
              </div>
              <div className="loc-group">
                <FaRoute className="loc-icon teal" />
                <div className="loc-details">
                  <span className="loc-lbl">Destination</span>
                  <p className="loc-txt">{ride.destination.address}</p>
                </div>
              </div>
            </div>

            <div className="navigation-actions">
              {ride.status === 'accepted' && (
                <button onClick={() => handleUpdateStatus('ongoing')} className="btn-primary start-ride-btn">
                  Passenger Boarded (Start Ride)
                </button>
              )}
              {ride.status === 'ongoing' && (
                <button onClick={() => handleUpdateStatus('completed')} className="btn-primary complete-ride-btn">
                  Arrived at Destination (Complete Ride)
                </button>
              )}
              {ride.status === 'completed' && (
                <div className="success-banner">
                  <FaCheckCircle /> Ride Completed Successfully!
                </div>
              )}
            </div>
          </div>

          {/* Map */}
          <div className="map-panel glass-card">
            <div ref={mapRef} className="active-leaflet-map"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActiveRide;
