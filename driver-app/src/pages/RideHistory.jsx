import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { formatDate } from '../utils/helpers';
import { FaMapMarkerAlt, FaRoute, FaCalendarAlt, FaMoneyBillWave, FaStar, FaRegStar, FaArrowLeft, FaCar } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import './RideHistory.css';

const RideHistory = () => {
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all'); // 'all', 'completed', 'cancelled'
  const navigate = useNavigate();

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const response = await api.get('/rides/history');
      setRides(response.data.rides || []);
    } catch (err) {
      console.error('Error fetching ride history:', err);
      setError('Could not load ride history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const renderStars = (rating) => {
    return (
      <div className="rating-stars">
        {[...Array(5)].map((_, i) => (
          i < rating ? <FaStar key={i} className="star-filled" /> : <FaRegStar key={i} className="star-empty" />
        ))}
      </div>
    );
  };

  const filteredRides = rides.filter(ride => {
    if (filter === 'completed') return ride.status === 'completed';
    if (filter === 'cancelled') return ride.status === 'cancelled';
    return true; // 'all'
  });

  if (loading) {
    return (
      <div className="history-loading">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="ride-history-page animate-fadeIn">
      <div className="history-container">
        <div className="page-header">
          <button onClick={() => navigate('/dashboard')} className="btn-back">
            <FaArrowLeft /> Dashboard
          </button>
          <h2 className="gradient-text">Your Jobs History</h2>
        </div>

        {error && <div className="error-message">{error}</div>}

        {/* Filter Tabs */}
        <div className="filter-tabs glass-card">
          <button
            onClick={() => setFilter('all')}
            className={`tab-btn ${filter === 'all' ? 'active' : ''}`}
          >
            All Jobs ({rides.length})
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={`tab-btn ${filter === 'completed' ? 'active' : ''}`}
          >
            Completed ({rides.filter(r => r.status === 'completed').length})
          </button>
          <button
            onClick={() => setFilter('cancelled')}
            className={`tab-btn ${filter === 'cancelled' ? 'active' : ''}`}
          >
            Cancelled ({rides.filter(r => r.status === 'cancelled').length})
          </button>
        </div>

        {filteredRides.length === 0 ? (
          <div className="empty-history glass-card">
            <FaCar className="empty-icon" />
            <h3>No trips found</h3>
            <p>You don't have any trips matching the selected filter.</p>
          </div>
        ) : (
          <div className="rides-list">
            {filteredRides.map((ride, index) => (
              <div
                key={ride._id}
                className="ride-card glass-card animate-slideUp"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <div className="ride-card-header">
                  <div className="ride-date">
                    <FaCalendarAlt />
                    <span>{formatDate(ride.createdAt)}</span>
                  </div>
                  <span className={`badge badge-${ride.status}`}>{ride.status}</span>
                </div>

                <div className="ride-locations">
                  <div className="location-item">
                    <FaMapMarkerAlt className="icon-pickup" />
                    <div className="location-details">
                      <span className="location-label">Pickup</span>
                      <p className="location-text">{ride.pickup.address}</p>
                    </div>
                  </div>
                  <div className="location-item">
                    <FaMapMarkerAlt className="icon-dest" />
                    <div className="location-details">
                      <span className="location-label">Destination</span>
                      <p className="location-text">{ride.destination.address}</p>
                    </div>
                  </div>
                </div>

                <div className="ride-card-footer">
                  <div className="ride-stats-row">
                    <div className="stat-box">
                      <FaMoneyBillWave />
                      <span>Earned: ₹{ride.fare}</span>
                    </div>
                    {ride.distance && (
                      <div className="stat-box-sec">
                        <span>{ride.distance} km</span>
                      </div>
                    )}
                  </div>

                  {ride.rider && (
                    <div className="ride-passenger-summary">
                      <span className="passenger-lbl">Passenger:</span>
                      <span className="passenger-val">{ride.rider.name}</span>
                    </div>
                  )}

                  {ride.status === 'completed' && (
                    <div className="rating-display-section">
                      {ride.rating ? (
                        <div className="rating-stars-wrapper">
                          <span>Rating:</span>
                          {renderStars(ride.rating)}
                        </div>
                      ) : (
                        <span className="no-rating-lbl">No rating received</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default RideHistory;
