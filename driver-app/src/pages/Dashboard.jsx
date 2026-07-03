import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import useGeolocation from '../hooks/useGeolocation';
import api from '../services/api';
import StatusToggle from '../components/StatusToggle';
import { FaUser, FaStar, FaCar, FaMapMarkerAlt, FaRoute } from 'react-icons/fa';
import L from 'leaflet';
import './Dashboard.css';

// Fix Leaflet icons
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

// Custom green car icon for driver location
const pulsingDriverHtml = `
  <div class="driver-marker-pulsing">
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

const Dashboard = () => {
  const { user, token } = useAuth();
  const socket = useSocket();
  const navigate = useNavigate();
  const { location: geoLoc } = useGeolocation();

  const [isOnline, setIsOnline] = useState(false);
  const [activeRide, setActiveRide] = useState(null);
  const [stats, setStats] = useState({ rating: 5, totalRides: 0 });
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Map refs
  const mapRef = useRef(null);
  const leafletMap = useRef(null);
  const driverMarker = useRef(null);
  const routePolyline = useRef(null);
  const locationInterval = useRef(null);

  // Fetch initial profile stats and active rides on mount
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const profileRes = await api.get('/auth/profile');
        const driver = profileRes.data.user;
        setIsOnline(driver.isOnline);
        setStats({
          rating: driver.rating || 5,
          totalRides: driver.totalRides || 0
        });

        // Fetch ride history to look for active (accepted/ongoing) rides
        const historyRes = await api.get('/rides/history');
        const rides = historyRes.data.rides || [];
        const active = rides.find(r => ['accepted', 'ongoing'].includes(r.status));
        if (active) {
          setActiveRide(active);
        }

        // Fetch pending requests count
        const incomingRes = await api.get('/drivers/incoming-rides');
        setPendingRequestsCount(incomingRes.data.rides?.length || 0);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      }
    };

    fetchInitialData();
  }, []);

  // Set up socket listeners
  useEffect(() => {
    if (!socket) return;

    socket.on('new-ride-request', () => {
      setPendingRequestsCount(prev => prev + 1);
    });

    socket.on('ride-status-update', (data) => {
      const ride = data.ride || data.rideData;
      if (!ride) return;
      // If active ride is cancelled, clear it
      if (activeRide && activeRide._id === ride._id && ride.status === 'cancelled') {
        setActiveRide(null);
        clearRoute();
        alert('Active ride has been cancelled by the rider.');
      }
    });

    return () => {
      socket.off('new-ride-request');
      socket.off('ride-status-update');
    };
  }, [socket, activeRide]);

  // Handle Online/Offline Status Toggle
  const handleToggleOnline = async () => {
    setUpdatingStatus(true);
    try {
      const response = await api.patch('/drivers/toggle-availability');
      const updatedDriver = response.data.driver || response.data;
      setIsOnline(updatedDriver.isOnline);

      if (socket) {
        socket.emit(updatedDriver.isOnline ? 'driver-online' : 'driver-offline', {
          driverId: user?._id || user?.id,
        });
      }
    } catch (err) {
      console.error('Toggle online failed:', err);
      alert('Failed to change status.');
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Location broadcasting effect when online
  useEffect(() => {
    if (isOnline && geoLoc) {
      // 1. Update backend location via API
      api.patch('/drivers/update-location', {
        coordinates: [geoLoc.lng, geoLoc.lat],
      }).catch(err => console.error('Location update API error:', err));

      // 2. Broadcast via socket immediately, and every 10s
      const sendLocation = () => {
        if (socket) {
          socket.emit('driver-location-update', {
            driverId: user?._id || user?.id,
            riderId: activeRide?.rider?._id || activeRide?.rider?.id || activeRide?.rider,
            coordinates: [geoLoc.lng, geoLoc.lat],
          });
        }
      };

      sendLocation();
      
      if (locationInterval.current) clearInterval(locationInterval.current);
      locationInterval.current = setInterval(sendLocation, 10000);
    } else {
      if (locationInterval.current) {
        clearInterval(locationInterval.current);
        locationInterval.current = null;
      }
    }

    return () => {
      if (locationInterval.current) clearInterval(locationInterval.current);
    };
  }, [isOnline, geoLoc, socket, user, activeRide]);

  // Leaflet map initialization
  useEffect(() => {
    if (!leafletMap.current && mapRef.current) {
      const mumbaiCoords = [19.0760, 72.8777];
      const center = geoLoc ? [geoLoc.lat, geoLoc.lng] : mumbaiCoords;

      leafletMap.current = L.map(mapRef.current, {
        zoomControl: false,
      }).setView(center, 14);

      L.control.zoom({ position: 'bottomright' }).addTo(leafletMap.current);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
      }).addTo(leafletMap.current);
    }

    return () => {
      if (leafletMap.current) {
        leafletMap.current.remove();
        leafletMap.current = null;
      }
    };
  }, []);

  // Update map and driver marker based on geolocation
  useEffect(() => {
    if (leafletMap.current && geoLoc) {
      const pos = [geoLoc.lat, geoLoc.lng];

      if (!driverMarker.current) {
        driverMarker.current = L.marker(pos, { icon: driverPosIcon }).addTo(leafletMap.current);
        leafletMap.current.setView(pos, 15);
      } else {
        driverMarker.current.setLatLng(pos);
      }
    }
  }, [geoLoc]);

  // Draw active ride route on map
  useEffect(() => {
    if (leafletMap.current && activeRide) {
      const pLat = activeRide.pickup.coordinates[1];
      const pLng = activeRide.pickup.coordinates[0];
      const dLat = activeRide.destination.coordinates[1];
      const dLng = activeRide.destination.coordinates[0];

      clearRoute();

      routePolyline.current = L.polyline([[pLat, pLng], [dLat, dLng]], {
        color: '#10b981',
        weight: 4,
        opacity: 0.8,
        dashArray: '8, 8',
      }).addTo(leafletMap.current);

      // Fit map to show both markers
      const bounds = L.latLngBounds([[pLat, pLng], [dLat, dLng]]);
      leafletMap.current.fitBounds(bounds, { padding: [50, 50] });
    } else {
      clearRoute();
    }
  }, [activeRide]);

  const clearRoute = () => {
    if (routePolyline.current) {
      routePolyline.current.remove();
      routePolyline.current = null;
    }
  };

  const handleStartRide = async () => {
    try {
      const response = await api.patch(`/rides/${activeRide._id}/status`, { status: 'ongoing' });
      const updatedRide = response.data.ride;
      setActiveRide(updatedRide);
      
      if (socket) {
        socket.emit('ride-status-update', { ride: updatedRide });
      }
    } catch (err) {
      console.error('Start ride error:', err);
      alert('Could not start ride.');
    }
  };

  const handleCompleteRide = async () => {
    try {
      const response = await api.patch(`/rides/${activeRide._id}/status`, { status: 'completed' });
      const updatedRide = response.data.ride;
      setActiveRide(null);
      clearRoute();
      
      // Update statistics
      setStats(prev => ({
        ...prev,
        totalRides: prev.totalRides + 1
      }));

      if (socket) {
        socket.emit('ride-status-update', { ride: updatedRide });
      }

      alert('Ride completed! Excellent job.');
      navigate('/dashboard');
    } catch (err) {
      console.error('Complete ride error:', err);
      alert('Could not complete ride.');
    }
  };

  return (
    <div className="dashboard-page">
      <div className="dashboard-layout">
        {/* Sidebar */}
        <div className="sidebar glass-card animate-slideIn">
          <div className="profile-summary">
            <div className="avatar">
              <FaUser />
            </div>
            <h3>{user?.name}</h3>
            <p className="vehicle-info">
              {user?.vehicleDetails?.color} {user?.vehicleDetails?.make} {user?.vehicleDetails?.model}
            </p>
            <div className="rating-box">
              <FaStar className="star-icon" />
              <span>{parseFloat(stats.rating).toFixed(1)} Rating</span>
            </div>
          </div>

          <div className="availability-card glass-card">
            <h4>Availability Status</h4>
            <StatusToggle
              isOnline={isOnline}
              onToggle={handleToggleOnline}
              disabled={updatingStatus}
            />
          </div>

          <div className="quick-stats-grid">
            <div className="stat-card glass-card">
              <span className="stat-label">Total Jobs</span>
              <span className="stat-value">{stats.totalRides}</span>
            </div>
            
            <Link to="/incoming" className="stat-card glass-card interactive-card">
              <span className="stat-label">Pending Requests</span>
              <div className="request-badge-wrapper">
                <span className="stat-value">{pendingRequestsCount}</span>
                {pendingRequestsCount > 0 && <span className="pulsing-notification-badge"></span>}
              </div>
            </Link>
          </div>
        </div>

        {/* Main Content */}
        <div className="main-content-flow">
          {activeRide ? (
            <div className="active-ride-overview glass-card animate-slideUp">
              <div className="active-ride-header">
                <span className="badge badge-ongoing">Active Job</span>
                <span className="active-ride-fare">Est: ₹{activeRide.fare}</span>
              </div>

              <div className="rider-summary">
                <div className="rider-avatar-bubble">👤</div>
                <div className="rider-info-txt">
                  <p className="r-name">{activeRide.rider?.name}</p>
                  <p className="r-phone">📞 {activeRide.rider?.phone}</p>
                </div>
              </div>

              <div className="active-ride-locations">
                <div className="loc-item">
                  <FaMapMarkerAlt className="pickup-green" />
                  <p>{activeRide.pickup?.address}</p>
                </div>
                <div className="loc-item">
                  <FaRoute className="dest-teal" />
                  <p>{activeRide.destination?.address}</p>
                </div>
              </div>

              <div className="active-ride-actions">
                {activeRide.status === 'accepted' ? (
                  <button onClick={handleStartRide} className="btn-primary start-ride-btn">
                    Start Ride (Picked up Passenger)
                  </button>
                ) : (
                  <button onClick={handleCompleteRide} className="btn-primary complete-ride-btn">
                    Complete Ride (Arrived at Destination)
                  </button>
                )}
                
                <Link to={`/ride/${activeRide._id}`} className="btn-secondary details-link-btn">
                  Open Navigation Map
                </Link>
              </div>
            </div>
          ) : (
            <div className="no-active-job glass-card animate-fadeIn">
              <FaCar className="car-bg-icon" />
              <h3>No active job</h3>
              <p>
                {isOnline
                  ? 'Waiting for new ride requests... Keep looking at "Incoming Requests".'
                  : 'Go ONLINE to start receiving ride requests.'}
              </p>
            </div>
          )}

          {/* Leaflet Map */}
          <div className="dashboard-map-panel glass-card">
            <div ref={mapRef} className="dashboard-leaflet-map"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
