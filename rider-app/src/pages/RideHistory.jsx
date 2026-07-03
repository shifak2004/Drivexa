import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { formatDate } from '../utils/helpers';
import RatingModal from '../components/RatingModal';
import { FaMapMarkerAlt, FaRoute, FaCalendarAlt, FaMoneyBillWave, FaStar, FaRegStar } from 'react-icons/fa';
import './RideHistory.css';

const RideHistory = () => {
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [ratingRideId, setRatingRideId] = useState(null);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const response = await api.get('/rides/history');
      setRides(response.data.rides || []);
    } catch (err) {
      console.error('Error fetching ride history:', err);
      setError('Could not load ride history. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleRatingSuccess = () => {
    setRatingRideId(null);
    fetchHistory(); // Refresh to update rating stars
  };

  const renderStars = (rating) => {
    return (
      <div className="rating-stars">
        {[...Array(5)].map((_, i) => (
          i < rating ? <FaStar key={i} className="star-filled" /> : <FaRegStar key={i} className="star-empty" />
        ))}
      </div>
    );
  };

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
        <h2 className="gradient-text page-title">Your Trips</h2>

        {error && <div className="error-message">{error}</div>}

        {rides.length === 0 ? (
          <div className="empty-history glass-card">
            <FaRoute className="empty-icon" />
            <h3>No trips yet</h3>
            <p>Your ride history will appear here once you take a ride.</p>
          </div>
        ) : (
          <div className="rides-list">
            {rides.map((ride, index) => (
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
                      <span>₹{ride.fare}</span>
                    </div>
                    {ride.distance && (
                      <div className="stat-box-sec">
                        <span>{ride.distance} km</span>
                      </div>
                    )}
                  </div>

                  {ride.status === 'completed' && (
                    <div className="rating-action-section">
                      {ride.rating ? (
                        <div className="rating-display">
                          <span>Rated:</span>
                          {renderStars(ride.rating)}
                        </div>
                      ) : (
                        <button
                          onClick={() => setRatingRideId(ride._id)}
                          className="btn-primary rate-trip-btn"
                        >
                          Rate Driver
                        </button>
                      )}
                    </div>
                  )}

                  {ride.driver && (
                    <div className="ride-driver-summary">
                      <span className="driver-lbl">Driver:</span>
                      <span className="driver-val">{ride.driver.name}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {ratingRideId && (
        <RatingModal
          rideId={ratingRideId}
          onClose={() => setRatingRideId(null)}
          onSuccess={handleRatingSuccess}
        />
      )}
    </div>
  );
};

export default RideHistory;
