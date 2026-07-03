import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useSocket } from '../context/SocketContext';
import { formatDate } from '../utils/helpers';
import { FaMapMarkerAlt, FaCar, FaUserTie, FaPhone, FaArrowLeft } from 'react-icons/fa';
import L from 'leaflet';
import './RideTracking.css';

// Fix Leaflet icons
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

// Custom green car icon for driver
const driverCarHtml = `
  <div class="driver-car-marker active-tracking">
    <div class="car-icon-inner">🚗</div>
  </div>
`;
const driverIcon = L.divIcon({
  html: driverCarHtml,
  className: 'driver-custom-marker',
  iconSize: [36, 36],
  iconAnchor: [18, 18]
});

const RideTracking = () => {
  const { id } = useParams();
  const socket = useSocket();
  const navigate = useNavigate();
  
  const [ride, setRide] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const mapRef = useRef(null);
  const leafletMap = useRef(null);
  const driverMarker = useRef(null);
  const pickupMarker = useRef(null);
  const destMarker = useRef(null);
  const routePolyline = useRef(null);

  // Fetch Ride Details on mount
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

  // Set up socket listeners for real-time status and driver location
  useEffect(() => {
    if (!socket) return;

    socket.on('ride-status-update', (data) => {
      console.log('Tracking page status update:', data);
      const updatedRide = data.ride || data.rideData;
      if (!updatedRide) return;
      if (updatedRide._id === id) {
        setRide(updatedRide);
        if (updatedRide.status === 'completed') {
          // Navigate to history or completed view
          setTimeout(() => {
            navigate('/history');
          }, 3000);
        }
      }
    });

    socket.on('driver-location-update', (data) => {
      const { driverId } = data;
      const coordinates = data.coordinates || data.location?.coordinates;
      if (!coordinates || coordinates.length !== 2) return;
      if (ride && ride.driver && ride.driver._id === driverId) {
        const pos = [coordinates[1], coordinates[0]]; // [lat, lng]
        
        // Update driver marker on map
        if (leafletMap.current) {
          if (!driverMarker.current) {
            driverMarker.current = L.marker(pos, { icon: driverIcon })
              .addTo(leafletMap.current)
              .bindPopup('Your driver is here');
          } else {
            driverMarker.current.setLatLng(pos);
          }
        }
      }
    });

    return () => {
      socket.off('ride-status-update');
      socket.off('driver-location-update');
    };
  }, [socket, ride, id, navigate]);

  // Initialize Map when ride details are available
  useEffect(() => {
    if (ride && mapRef.current && !leafletMap.current) {
      const pickupCoords = [ride.pickup.coordinates[1], ride.pickup.coordinates[0]];
      const destCoords = [ride.destination.coordinates[1], ride.destination.coordinates[0]];

      leafletMap.current = L.map(mapRef.current, {
        zoomControl: false,
      }).setView(pickupCoords, 14);

      L.control.zoom({ position: 'bottomright' }).addTo(leafletMap.current);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
      }).addTo(leafletMap.current);

      // Add pickup marker
      pickupMarker.current = L.marker(pickupCoords, {
        icon: L.icon({
          iconUrl: icon,
          shadowUrl: iconShadow,
          iconSize: [25, 41],
          iconAnchor: [12, 41],
        })
      }).addTo(leafletMap.current).bindPopup('Pickup Location');

      // Add destination marker
      destMarker.current = L.marker(destCoords, {
        icon: L.icon({
          iconUrl: icon,
          shadowUrl: iconShadow,
          iconSize: [25, 41],
          iconAnchor: [12, 41],
        })
      }).addTo(leafletMap.current).bindPopup('Destination Location');

      // Draw polyline route
      routePolyline.current = L.polyline([pickupCoords, destCoords], {
        color: '#7c3aed',
        weight: 4,
        opacity: 0.8,
        dashArray: '8, 8',
      }).addTo(leafletMap.current);

      // Fit bounds
      const bounds = L.latLngBounds([pickupCoords, destCoords]);
      leafletMap.current.fitBounds(bounds, { padding: [50, 50] });

      // If driver is already assigned, add driver marker
      if (ride.driver && ride.driver.location && ride.driver.location.coordinates) {
        const driverCoords = [ride.driver.location.coordinates[1], ride.driver.location.coordinates[0]];
        driverMarker.current = L.marker(driverCoords, { icon: driverIcon }).addTo(leafletMap.current);
      }
    }
  }, [ride]);

  const handleCancel = async () => {
    if (!window.confirm('Are you sure you want to cancel this ride?')) return;
    try {
      const response = await api.patch(`/rides/${id}/cancel`);
      const cancelledRide = response.data.ride;
      if (socket) {
        socket.emit('ride-status-update', {
          ride: cancelledRide,
          rideId: id,
          status: 'cancelled',
        });
      }
      navigate('/book');
    } catch (err) {
      console.error('Error cancelling ride:', err);
      alert('Failed to cancel ride.');
    }
  };

  const getStatusStepClass = (step) => {
    const statusOrder = ['pending', 'accepted', 'ongoing', 'completed'];
    const currentIdx = statusOrder.indexOf(ride?.status);
    const stepIdx = statusOrder.indexOf(step);

    if (stepIdx < currentIdx) return 'step completed';
    if (stepIdx === currentIdx) return 'step active';
    return 'step pending';
  };

  if (loading) {
    return (
      <div className="tracking-loading">
        <div className="spinner"></div>
      </div>
    );
  }

  if (error || !ride) {
    return (
      <div className="tracking-error">
        <p>{error || 'Ride not found.'}</p>
        <button onClick={() => navigate('/book')} className="btn-primary">Go Home</button>
      </div>
    );
  }

  return (
    <div className="ride-tracking-page animate-fadeIn">
      <div className="tracking-container">
        {/* Top bar */}
        <div className="tracking-header">
          <button onClick={() => navigate('/book')} className="btn-back">
            <FaArrowLeft /> Back
          </button>
          <h2>Track Your Trip</h2>
        </div>

        {/* Stepper progress */}
        <div className="status-stepper glass-card">
          <div className={getStatusStepClass('pending')}>
            <div className="step-number">1</div>
            <div className="step-label">Requested</div>
          </div>
          <div className="step-divider"></div>
          <div className={getStatusStepClass('accepted')}>
            <div className="step-number">2</div>
            <div className="step-label">Accepted</div>
          </div>
          <div className="step-divider"></div>
          <div className={getStatusStepClass('ongoing')}>
            <div className="step-number">3</div>
            <div className="step-label">Ongoing</div>
          </div>
          <div className="step-divider"></div>
          <div className={getStatusStepClass('completed')}>
            <div className="step-number">4</div>
            <div className="step-label">Arrived</div>
          </div>
        </div>

        <div className="tracking-content">
          {/* Left panel: Info */}
          <div className="tracking-info-panel glass-card">
            <div className="info-section">
              <span className="info-label">Status</span>
              <span className={`badge badge-${ride.status} status-display`}>{ride.status}</span>
            </div>

            <div className="info-section">
              <span className="info-label">Pickup Location</span>
              <p className="info-text">{ride.pickup.address}</p>
            </div>

            <div className="info-section">
              <span className="info-label">Destination</span>
              <p className="info-text">{ride.destination.address}</p>
            </div>

            <div className="fare-distance-box">
              <div className="fd-item">
                <span className="fd-lbl">Est. Fare</span>
                <span className="fd-val">₹{ride.fare}</span>
              </div>
              <div className="fd-item">
                <span className="fd-lbl">Distance</span>
                <span className="fd-val">{ride.distance} km</span>
              </div>
            </div>

            {ride.driver ? (
              <div className="assigned-driver-card glass-card">
                <h4>Your Driver</h4>
                <div className="driver-details-tracking">
                  <div className="driver-avatar">
                    <FaUserTie />
                  </div>
                  <div className="driver-desc">
                    <p className="driver-name-lbl">{ride.driver.name}</p>
                    <p className="driver-phone-lbl"><FaPhone /> {ride.driver.phone}</p>
                    <div className="vehicle-tag">
                      <FaCar /> {ride.driver.vehicleDetails?.color} {ride.driver.vehicleDetails?.make} {ride.driver.vehicleDetails?.model}
                    </div>
                    <span className="plate-badge">{ride.driver.vehicleDetails?.plateNumber}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="searching-driver-info">
                <div className="spinner"></div>
                <p>Waiting for a driver to accept your ride...</p>
              </div>
            )}

            {['pending', 'accepted'].includes(ride.status) && (
              <button onClick={handleCancel} className="btn-cancel-active">
                Cancel Ride Request
              </button>
            )}

            {ride.status === 'completed' && (
              <div className="completed-success-alert glass-card">
                <h3>Trip Completed!</h3>
                <p>Hope you had a great ride. You will be redirected shortly to rate your experience.</p>
              </div>
            )}
          </div>

          {/* Right panel: Map */}
          <div className="tracking-map-panel glass-card">
            <div ref={mapRef} className="tracking-leaflet-map"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RideTracking;
