import React, { useState } from 'react';
import { FaStar, FaTimes } from 'react-icons/fa';
import api from '../services/api';
import './RatingModal.css';

const RatingModal = ({ rideId, onClose, onSuccess }) => {
  const [rating, setRating] = useState(5);
  const [hover, setHover] = useState(null);
  const [review, setReview] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      await api.post(`/ratings/${rideId}`, { rating, review });
      onSuccess();
    } catch (err) {
      console.error('Error submitting rating:', err);
      setError(err.response?.data?.message || 'Failed to submit rating. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="rating-modal-overlay">
      <div className="rating-modal-card glass-card animate-scaleUp">
        <button onClick={onClose} className="btn-close-modal">
          <FaTimes />
        </button>

        <h3 className="gradient-text">Rate Your Ride</h3>
        <p className="modal-subtitle">How was your experience with the driver?</p>

        <form onSubmit={handleSubmit} className="rating-form">
          {error && <div className="error-message">{error}</div>}

          <div className="star-rating-container">
            {[...Array(5)].map((star, index) => {
              const ratingValue = index + 1;
              return (
                <label key={index}>
                  <input
                    type="radio"
                    name="rating"
                    value={ratingValue}
                    onClick={() => setRating(ratingValue)}
                    style={{ display: 'none' }}
                  />
                  <FaStar
                    className="star-icon"
                    color={ratingValue <= (hover || rating) ? '#f59e0b' : '#334155'}
                    size={40}
                    onMouseEnter={() => setHover(ratingValue)}
                    onMouseLeave={() => setHover(null)}
                  />
                </label>
              );
            })}
          </div>

          <div className="form-group">
            <label htmlFor="review">Write a Review (Optional)</label>
            <div className="input-container">
              <textarea
                id="review"
                rows="4"
                placeholder="Share your experience..."
                value={review}
                onChange={(e) => setReview(e.target.value)}
                style={{ paddingLeft: '16px' }} // Textarea doesn't need an icon
              />
            </div>
          </div>

          <button type="submit" className="btn-primary submit-rating-btn" disabled={isSubmitting}>
            {isSubmitting ? <div className="spinner"></div> : 'Submit Rating'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default RatingModal;
