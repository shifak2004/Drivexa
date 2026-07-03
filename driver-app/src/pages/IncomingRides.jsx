import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useSocket } from '../context/SocketContext';
import { FaMapMarkerAlt, FaRoute, FaArrowLeft, FaCheck, FaTimes, FaMoneyBillWave, FaListUl } from 'react-icons/fa';
import './IncomingRides.css';

const IncomingRides = () => {
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [acceptingId, setAcceptingId] = useState(null);
  
  const socket = useSocket();
  const navigate = useNavigate();

  const fetchIncoming = async () => {
    try {
      const response = await api.get('/drivers/incoming-rides');
      setRides(response.data.rides || []);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching incoming rides:', err);
      setError('Could not load incoming requests.');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncoming();
  }, []);

  // Listen to Socket.IO for new ride requests in real-time
  useEffect(() => {
    if (!socket) return;

    socket.on('new-ride-request', (data) => {
      console.log('Socket: Received new ride request', data);
      const { ride } = data;
      
      // Add to list if not already there
      setRides(prev => {
        if (prev.find(r => r._id === ride._id)) return prev;
        return [ride, ...prev];
      });
      
      // Play a subtle notification chime if supported
      try {
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-84.wav');
        audio.volume = 0.3;
        audio.play();
      } catch (e) {
        // Audio playback prevented/unsupported
      }
    });

    socket.on('ride-status-update', (data) => {
      const ride = data.ride || data.rideData;
      if (!ride) return;
      // If ride is cancelled or accepted by someone else, remove it
      if (ride.status !== 'pending') {
        setRides(prev => prev.filter(r => r._id !== ride._id));
      }
    });

    return () => {
      socket.off('new-ride-request');
      socket.off('ride-status-update');
    };
  }, [socket]);

  const handleAccept = async (rideId) => {
    setAcceptingId(rideId);
    try {
      const response = await api.patch(`/rides/${rideId}/accept`);
      const { ride } = response.data;

      // Broadcast ride acceptance
      if (socket) {
        socket.emit('ride-accepted', {
          ride,
          riderId: ride.rider?._id || ride.rider?.id || ride.rider,
        });
      }

      navigate('/dashboard'); // Go back to dashboard where active ride will be displayed
    } catch (err) {
      console.error('Error accepting ride:', err);
      alert(err.response?.data?.message || 'Could not accept ride.');
      // Refresh list
      fetchIncoming();
    } finally {
      setAcceptingId(null);
    }
  };

  const handleReject = async (rideId) => {
    try {
      await api.patch(`/rides/${rideId}/reject`);
      // Locally remove from list
      setRides(prev => prev.filter(r => r._id !== rideId));
    } catch (err) {
      console.error('Error rejecting ride:', err);
      // Just filter locally anyway
      setRides(prev => prev.filter(r => r._id !== rideId));
    }
  };

  if (loading) {
    return (
      <div className="incoming-loading">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="incoming-rides-page animate-fadeIn">
      <div className="incoming-container">
        <div className="page-header">
          <button onClick={() => navigate('/dashboard')} className="btn-back">
            <FaArrowLeft /> Dashboard
          </button>
          <h2 className="gradient-text">Incoming Jobs</h2>
        </div>

        {error && <div className="error-message">{error}</div>}

        {rides.length === 0 ? (
          <div className="empty-incoming glass-card">
            <FaListUl className="empty-icon-list" />
            <h3>No pending requests</h3>
            <p>New ride requests will appear here in real-time as riders search for rides.</p>
          </div>
        ) : (
          <div className="requests-list">
            {rides.map((ride) => (
              <div key={ride._id} className="request-card glass-card animate-slideIn alert-border">
                <div className="request-card-header">
                  <div className="rider-avatar-small">👤</div>
                  <div className="rider-meta">
                    <span className="rider-name-lbl">{ride.rider?.name || 'Rider'}</span>
                    <span className="rider-phone-lbl">📞 {ride.rider?.phone}</span>
                  </div>
                  <span className="fare-badge">₹{ride.fare}</span>
                </div>

                <div className="request-locations">
                  <div className="loc-row">
                    <FaMapMarkerAlt className="loc-pin pickup" />
                    <div className="loc-text-details">
                      <span className="loc-lbl">Pickup</span>
                      <p>{ride.pickup.address}</p>
                    </div>
                  </div>
                  <div className="loc-row">
                    <FaRoute className="loc-pin dest" />
                    <div className="loc-text-details">
                      <span className="loc-lbl">Destination</span>
                      <p>{ride.destination.address}</p>
                    </div>
                  </div>
                </div>

                <div className="request-stats">
                  <div className="stat-pill">
                    <FaMoneyBillWave />
                    <span>Est. Distance: {ride.distance || 'N/A'} km</span>
                  </div>
                </div>

                <div className="request-actions">
                  <button
                    onClick={() => handleAccept(ride._id)}
                    className="btn-primary accept-btn"
                    disabled={acceptingId !== null}
                  >
                    {acceptingId === ride._id ? <div className="spinner"></div> : <><FaCheck /> Accept Ride</>}
                  </button>
                  <button
                    onClick={() => handleReject(ride._id)}
                    className="btn-reject"
                    disabled={acceptingId !== null}
                  >
                    <FaTimes /> Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default IncomingRides;
