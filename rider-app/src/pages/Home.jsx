import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import useGeolocation from '../hooks/useGeolocation';
import api from '../services/api';
import { haversineDistance, calculateFare } from '../utils/helpers';
import { FaLocationArrow, FaMapMarkerAlt, FaRoute, FaUserTie, FaCar } from 'react-icons/fa';
import L from 'leaflet';
import './Home.css';

// Fix Leaflet marker icon issue in production/dev bundles
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

// Custom pulsing blue icon for user location
const pulsingRiderHtml = `
  <div class="rider-marker-pulsing">
    <div class="rider-marker-dot"></div>
    <div class="rider-marker-ring"></div>
  </div>
`;
const riderIcon = L.divIcon({
  html: pulsingRiderHtml,
  className: 'rider-custom-marker',
  iconSize: [24, 24],
  iconAnchor: [12, 12]
});

// Custom green car icon for available drivers
const driverCarHtml = `
  <div class="driver-car-marker">
    <div class="car-icon-inner">🚗</div>
  </div>
`;
const driverIcon = L.divIcon({
  html: driverCarHtml,
  className: 'driver-custom-marker',
  iconSize: [30, 30],
  iconAnchor: [15, 15]
});

const normalizeLocationQuery = (query) => {
  return query
    .trim()
    .replace(/\bbanglore\b/i, 'Bangalore')
    .replace(/\bbengaluru\b/i, 'Bangalore');
};

const Home = () => {
  const { user } = useAuth();
  const socket = useSocket();
  const navigate = useNavigate();
  const { location: geoLoc, error: geoErr, loading: geoLoading } = useGeolocation();

  // Booking states
  const [pickup, setPickup] = useState({ address: '', coords: null });
  const [destination, setDestination] = useState({ address: '', coords: null });
  const [destQuery, setDestQuery] = useState('');
  const [pickupSearching, setPickupSearching] = useState(false);
  const [destSearching, setDestSearching] = useState(false);
  
  const [distance, setDistance] = useState(0);
  const [fare, setFare] = useState(0);
  
  const [availableDrivers, setAvailableDrivers] = useState([]);
  const [selectedDriverId, setSelectedDriverId] = useState('');
  const [activeRide, setActiveRide] = useState(null);
  const [bookingStatus, setBookingStatus] = useState(''); // '', 'booking', 'searching', 'accepted'
  const [bookingError, setBookingError] = useState('');

  // Map refs
  const mapRef = useRef(null);
  const leafletMap = useRef(null);
  const riderMarker = useRef(null);
  const driverMarkers = useRef({});
  const routePolyline = useRef(null);

  // Initialize Map
  useEffect(() => {
    if (!leafletMap.current && mapRef.current) {
      // Create Leaflet map centered at user location or default (Mumbai)
      const defaultCenter = geoLoc ? [geoLoc.lat, geoLoc.lng] : [19.0760, 72.8777];
      
      leafletMap.current = L.map(mapRef.current, {
        zoomControl: false,
      }).setView(defaultCenter, 14);

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

  // Update Rider Location Marker
  useEffect(() => {
    if (leafletMap.current && geoLoc) {
      const pos = [geoLoc.lat, geoLoc.lng];
      
      // If we don't have a pickup address yet, reverse geocode it
      if (!pickup.coords) {
        handleReverseGeocode(geoLoc.lat, geoLoc.lng, true);
      }

      if (!riderMarker.current) {
        riderMarker.current = L.marker(pos, { icon: riderIcon }).addTo(leafletMap.current);
        leafletMap.current.setView(pos, 15);
      } else {
        riderMarker.current.setLatLng(pos);
      }
    }
  }, [geoLoc]);

  // Fetch Available Drivers
  useEffect(() => {
    const fetchDrivers = async () => {
      try {
        const response = await api.get('/drivers/available');
        setAvailableDrivers(response.data.drivers || []);
      } catch (err) {
        console.error('Error fetching drivers:', err);
      }
    };
    fetchDrivers();
    // Poll every 15s
    const interval = setInterval(fetchDrivers, 15000);
    return () => clearInterval(interval);
  }, []);

  // Update Driver Markers on Map
  useEffect(() => {
    if (!leafletMap.current) return;

    // Clear old driver markers not in new list
    const currentDriverIds = availableDrivers.map(d => d._id);
    Object.keys(driverMarkers.current).forEach(id => {
      if (!currentDriverIds.includes(id)) {
        driverMarkers.current[id].remove();
        delete driverMarkers.current[id];
      }
    });

    // Add/update driver markers
    availableDrivers.forEach(driver => {
      if (driver.location && driver.location.coordinates) {
        const coords = [driver.location.coordinates[1], driver.location.coordinates[0]];
        
        if (driverMarkers.current[driver._id]) {
          driverMarkers.current[driver._id].setLatLng(coords);
        } else {
          const marker = L.marker(coords, { icon: driverIcon })
            .addTo(leafletMap.current)
            .bindPopup(`<b>${driver.name}</b><br/>${driver.vehicleDetails?.make || ''} ${driver.vehicleDetails?.model || ''}`);
          driverMarkers.current[driver._id] = marker;
        }
      }
    });
  }, [availableDrivers]);

  useEffect(() => {
    if (!selectedDriverId) return;
    const selectedDriverStillAvailable = availableDrivers.some(driver => driver._id === selectedDriverId);
    if (!selectedDriverStillAvailable) {
      setSelectedDriverId('');
    }
  }, [availableDrivers, selectedDriverId]);

  // Check for any active ride of the rider on mount
  useEffect(() => {
    const checkActiveRide = async () => {
      try {
        const response = await api.get('/rides/history');
        const rides = response.data.rides || [];
        const active = rides.find(r => ['pending', 'accepted', 'ongoing'].includes(r.status));
        if (active) {
          setActiveRide(active);
          setBookingStatus(active.status === 'pending' ? 'searching' : active.status);
          
          // Set inputs to match
          setPickup({ address: active.pickup.address, coords: { lat: active.pickup.coordinates[1], lng: active.pickup.coordinates[0] } });
          setDestination({ address: active.destination.address, coords: { lat: active.destination.coordinates[1], lng: active.destination.coordinates[0] } });
          
          // Draw path
          drawRoute(
            active.pickup.coordinates[1], active.pickup.coordinates[0],
            active.destination.coordinates[1], active.destination.coordinates[0]
          );
        }
      } catch (err) {
        console.error('Error checking active ride:', err);
      }
    };
    checkActiveRide();
  }, []);

  // Set up socket listeners for real-time ride status
  useEffect(() => {
    if (!socket) return;

    socket.on('ride-accepted', (data) => {
      console.log('Socket: Ride accepted', data);
      const ride = data.ride || data.rideData;
      if (!ride) return;
      setActiveRide(ride);
      setBookingStatus('accepted');
    });

    socket.on('ride-status-update', (data) => {
      console.log('Socket: Ride status updated', data);
      const ride = data.ride || data.rideData;
      if (!ride) return;
      setActiveRide(ride);
      setBookingStatus(ride.status);

      if (ride.status === 'completed') {
        // Redirect or show completed state
        setBookingStatus('');
        setActiveRide(null);
        navigate(`/ride/${ride._id}`);
      } else if (ride.status === 'cancelled') {
        setBookingStatus('');
        setActiveRide(null);
        setBookingError('Your ride was cancelled.');
        clearRoute();
      }
    });

    // Driver location stream
    socket.on('driver-location-update', (data) => {
      console.log('Socket: Driver location update', data);
      const { driverId } = data;
      const coordinates = data.coordinates || data.location?.coordinates;
      if (!coordinates || coordinates.length !== 2) return;
      const pos = [coordinates[1], coordinates[0]]; // [lat, lng]

      // Update specific driver location marker on map
      if (leafletMap.current) {
        if (driverMarkers.current[driverId]) {
          driverMarkers.current[driverId].setLatLng(pos);
        } else {
          const marker = L.marker(pos, { icon: driverIcon }).addTo(leafletMap.current);
          driverMarkers.current[driverId] = marker;
        }
      }
    });

    return () => {
      socket.off('ride-accepted');
      socket.off('ride-status-update');
      socket.off('driver-location-update');
    };
  }, [socket, navigate]);

  const geocodeLocation = async (query) => {
    const normalizedQuery = normalizeLocationQuery(query);
    if (!normalizedQuery) return null;

    const searchParams = new URLSearchParams({
      format: 'json',
      q: normalizedQuery,
      limit: '1',
      countrycodes: 'in',
    });

    const response = await fetch(`https://nominatim.openstreetmap.org/search?${searchParams.toString()}`);
    const data = await response.json();

    if (!data || data.length === 0) return null;

    const item = data[0];
    return {
      address: item.display_name,
      coords: { lat: parseFloat(item.lat), lng: parseFloat(item.lon) },
    };
  };

  const updateRouteEstimate = (nextPickup, nextDestination) => {
    if (!nextPickup?.coords || !nextDestination?.coords) return;
    drawRoute(
      nextPickup.coords.lat,
      nextPickup.coords.lng,
      nextDestination.coords.lat,
      nextDestination.coords.lng
    );
  };

  const handlePickupSearch = async () => {
    if (!pickup.address) return;

    setPickupSearching(true);
    setBookingError('');
    try {
      const result = await geocodeLocation(pickup.address);
      if (!result) {
        setBookingError('Pickup address not found. Try city and state, like "Hubli Karnataka".');
        return;
      }

      setPickup(result);
      if (leafletMap.current) {
        leafletMap.current.setView([result.coords.lat, result.coords.lng], 13);
      }
      updateRouteEstimate(result, destination);
    } catch (err) {
      console.error('Pickup geocoding error:', err);
      setBookingError('Error searching pickup location.');
    } finally {
      setPickupSearching(false);
    }
  };

  // Handle Geocoding of Destination
  const handleDestinationSearch = async (e) => {
    e.preventDefault();
    if (!destQuery) return;

    setDestSearching(true);
    setBookingError('');
    try {
      const result = await geocodeLocation(destQuery);
      if (result) {
        setDestination(result);

        // Focus map to destination
        if (leafletMap.current) {
          leafletMap.current.setView([result.coords.lat, result.coords.lng], 13);
        }

        updateRouteEstimate(pickup, result);
      } else {
        setBookingError('Destination address not found. Try city and state, like "Bangalore Karnataka".');
      }
    } catch (err) {
      console.error('Geocoding error:', err);
      setBookingError('Error searching destination.');
    } finally {
      setDestSearching(false);
    }
  };

  // Handle reverse geocoding to fill address
  const handleReverseGeocode = async (lat, lng, isPickup = true) => {
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
      const data = await response.json();
      if (data) {
        if (isPickup) {
          setPickup({ address: data.display_name, coords: { lat, lng } });
        } else {
          setDestination({ address: data.display_name, coords: { lat, lng } });
        }
      }
    } catch (err) {
      console.error('Reverse geocoding error:', err);
    }
  };

  const handleUseMyLocation = () => {
    if (geoLoc) {
      handleReverseGeocode(geoLoc.lat, geoLoc.lng, true);
      if (leafletMap.current) {
        leafletMap.current.setView([geoLoc.lat, geoLoc.lng], 15);
      }
    }
  };

  // Draw simple path line
  const drawRoute = (lat1, lon1, lat2, lon2) => {
    if (!leafletMap.current) return;
    
    // Clear old route
    clearRoute();

    const dist = haversineDistance(lat1, lon1, lat2, lon2);
    setDistance(dist);
    setFare(calculateFare(dist));

    // Draw route polyline
    routePolyline.current = L.polyline([[lat1, lon1], [lat2, lon2]], {
      color: '#7c3aed',
      weight: 4,
      opacity: 0.8,
      dashArray: '8, 8',
    }).addTo(leafletMap.current);

    // Zoom map to fit both bounds
    const bounds = L.latLngBounds([[lat1, lon1], [lat2, lon2]]);
    leafletMap.current.fitBounds(bounds, { padding: [50, 50] });
  };

  const clearRoute = () => {
    if (routePolyline.current) {
      routePolyline.current.remove();
      routePolyline.current = null;
    }
  };

  // Submit Ride Request
  const handleBookRide = async () => {
    if (!pickup.coords || !destination.coords) {
      setBookingError('Please enter both pickup and destination locations.');
      return;
    }

    setBookingStatus('booking');
    setBookingError('');
    try {
      const response = await api.post('/rides/create', {
        pickup: {
          address: pickup.address,
          coordinates: [pickup.coords.lng, pickup.coords.lat],
        },
        destination: {
          address: destination.address,
          coordinates: [destination.coords.lng, destination.coords.lat],
        },
        driverId: selectedDriverId || undefined,
      });

      const { ride } = response.data;
      setActiveRide(ride);
      setBookingStatus('searching');

      // Emit new ride request socket event
      if (socket) {
        socket.emit('new-ride-request', { ride });
      }
    } catch (err) {
      console.error('Booking ride failed:', err);
      setBookingError(err.response?.data?.message || 'Failed to request ride.');
      setBookingStatus('');
    }
  };

  // Cancel ride request
  const handleCancelRide = async () => {
    if (!activeRide) return;
    try {
      const response = await api.patch(`/rides/${activeRide._id}/cancel`);
      const cancelledRide = response.data.ride;
      
      // Notify driver via socket
      if (socket) {
        socket.emit('ride-status-update', {
          ride: cancelledRide,
          rideId: activeRide._id,
          status: 'cancelled',
        });
      }

      setBookingStatus('');
      setActiveRide(null);
      clearRoute();
    } catch (err) {
      console.error('Cancel ride failed:', err);
      setBookingError('Failed to cancel ride.');
    }
  };

  return (
    <div className="home-page">
      <div className="main-content">
        {/* Left Side booking panel */}
        <div className="booking-panel glass-card animate-slideIn">
          <h2 className="gradient-text">Book your ride</h2>
          <p className="panel-subtitle">Get a ride in minutes</p>

          {!activeRide ? (
            <div className="booking-form-wrapper">
              {bookingError && <div className="error-message">{bookingError}</div>}

              {/* Pickup Group */}
              <div className="form-group">
                <label>Pickup Location</label>
                <div className="input-container">
                  <FaMapMarkerAlt className="input-icon-marker" />
                  <input
                    type="text"
                    placeholder="Auto-detecting location..."
                    value={pickup.address}
                    onChange={(e) => {
                      setPickup({ address: e.target.value, coords: null });
                      setDistance(0);
                      setFare(0);
                    }}
                  />
                </div>
                <button type="button" onClick={handlePickupSearch} className="btn-search-dest" disabled={pickupSearching}>
                  {pickupSearching ? <div className="spinner"></div> : 'Confirm Pickup'}
                </button>
                <button type="button" onClick={handleUseMyLocation} className="btn-use-location">
                  <FaLocationArrow /> Use Current Location
                </button>
              </div>

              {/* Destination Search */}
              <form onSubmit={handleDestinationSearch} className="form-group">
                <label>Destination Location</label>
                <div className="input-container">
                  <FaRoute className="input-icon-route" />
                  <input
                    type="text"
                    placeholder="Enter destination and press Enter"
                    value={destQuery}
                    onChange={(e) => {
                      setDestQuery(e.target.value);
                      setDestination({ address: '', coords: null });
                      setDistance(0);
                      setFare(0);
                    }}
                    required
                  />
                </div>
                <button type="submit" className="btn-search-dest" disabled={destSearching}>
                  {destSearching ? <div className="spinner"></div> : 'Confirm Destination'}
                </button>
              </form>

              {destination.coords && (
                <div className="fare-estimate-card glass-card animate-fadeIn">
                  <div className="fare-item">
                    <span className="label">Distance:</span>
                    <span className="value">{distance} km</span>
                  </div>
                  <div className="fare-item">
                    <span className="label">Est. Fare:</span>
                    <span className="value fare-highlight">₹{fare}</span>
                  </div>
                  <div className="fare-item">
                    <span className="label">Available Drivers:</span>
                    <span className="value badge badge-completed">{availableDrivers.length} Online</span>
                  </div>
                </div>
              )}

              {pickup.coords && destination.coords && availableDrivers.length > 0 && (
                <div className="driver-select-panel animate-fadeIn">
                  <div className="driver-select-header">
                    <span>Select Driver</span>
                    <button type="button" className="driver-auto-btn" onClick={() => setSelectedDriverId('')}>
                      Auto
                    </button>
                  </div>
                  <div className="driver-option-list">
                    {availableDrivers.map((driver) => {
                      const driverCoords = driver.location?.coordinates;
                      const driverDistance = driverCoords?.length === 2 && pickup.coords
                        ? haversineDistance(pickup.coords.lat, pickup.coords.lng, driverCoords[1], driverCoords[0])
                        : null;
                      const isSelected = selectedDriverId === driver._id;

                      return (
                        <button
                          key={driver._id}
                          type="button"
                          className={`driver-option ${isSelected ? 'selected' : ''}`}
                          onClick={() => setSelectedDriverId(driver._id)}
                        >
                          <span className="driver-option-icon"><FaCar /></span>
                          <span className="driver-option-info">
                            <strong>{driver.name}</strong>
                            <small>
                              {driver.vehicleDetails?.color} {driver.vehicleDetails?.make} {driver.vehicleDetails?.model}
                            </small>
                            <small>{driver.vehicleDetails?.plateNumber}</small>
                          </span>
                          <span className="driver-option-meta">
                            {driver.rating ? `${driver.rating.toFixed(1)} star` : '5.0 star'}
                            {driverDistance !== null && <small>{driverDistance} km away</small>}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <button
                onClick={handleBookRide}
                className="btn-primary book-btn"
                disabled={!pickup.coords || !destination.coords || bookingStatus === 'booking'}
              >
                {bookingStatus === 'booking' ? <div className="spinner"></div> : 'Book Drivexa'}
              </button>
            </div>
          ) : (
            /* Active booking status card */
            <div className="active-booking-card animate-fadeIn">
              <div className="booking-status-badge">
                <span className={`badge badge-${bookingStatus}`}>
                  {bookingStatus === 'searching' ? 'Finding nearby drivers...' : bookingStatus}
                </span>
              </div>

              {bookingStatus === 'searching' && (
                <div className="searching-animation">
                  <div className="sonar-emitter">
                    <div className="sonar-wave"></div>
                    <div className="sonar-wave"></div>
                    <div className="sonar-wave"></div>
                    <FaCar className="sonar-icon" />
                  </div>
                  <p className="pulse-text">Looking for available drivers near you</p>
                </div>
              )}

              {activeRide.driver && (
                <div className="driver-details-glass animate-slideUp">
                  <h4>Driver Assigned</h4>
                  <div className="driver-avatar-info">
                    <div className="avatar-placeholder">
                      <FaUserTie />
                    </div>
                    <div className="driver-bio">
                      <p className="driver-name">{activeRide.driver.name}</p>
                      <p className="driver-phone">📞 {activeRide.driver.phone}</p>
                      <div className="vehicle-desc">
                        <FaCar /> {activeRide.driver.vehicleDetails?.color} {activeRide.driver.vehicleDetails?.make} {activeRide.driver.vehicleDetails?.model} ({activeRide.driver.vehicleDetails?.plateNumber})
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="active-ride-actions">
                <button onClick={() => navigate(`/ride/${activeRide._id}`)} className="btn-secondary track-btn">
                  Track on Fullscreen Map
                </button>
                {(bookingStatus === 'searching' || bookingStatus === 'accepted') && (
                  <button onClick={handleCancelRide} className="btn-cancel-ride">
                    Cancel Ride Request
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Side Map */}
        <div className="map-panel">
          <div ref={mapRef} className="home-leaflet-map"></div>
        </div>
      </div>
    </div>
  );
};

export default Home;
