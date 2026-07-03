import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FaUser, FaAt, FaEnvelope, FaPhone, FaLock, FaCar } from 'react-icons/fa';
import { GiSteeringWheel as FaSteeringWheel } from 'react-icons/gi';
import './Signup.css';

const Signup = () => {
  const { signup } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    username: '',
    phone: '',
    password: '',
    vehicleMake: '',
    vehicleModel: '',
    vehicleColor: '',
    vehiclePlate: '',
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.id]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { name, email, username, phone, password, vehicleMake, vehicleModel, vehicleColor, vehiclePlate } = formData;
    if (!name || !email || !username || !phone || !password || !vehicleMake || !vehicleModel || !vehicleColor || !vehiclePlate) {
      setError('Please fill in all fields.');
      return;
    }

    setError('');
    setIsSubmitting(true);

    const apiData = {
      name,
      email,
      username,
      phone,
      password,
      vehicleDetails: {
        make: vehicleMake,
        model: vehicleModel,
        color: vehicleColor,
        plateNumber: vehiclePlate,
      }
    };

    const result = await signup(apiData);
    setIsSubmitting(false);

    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.error);
    }
  };

  return (
    <div className="signup-page">
      <div className="gradient-orb orb-1"></div>
      <div className="gradient-orb orb-2"></div>

      <div className="signup-card glass-card animate-slideUp">
        <div className="signup-header">
          <FaSteeringWheel className="signup-logo" />
          <h1 className="gradient-text">Driver Registration</h1>
          <p>Join Drivexa as a Partner</p>
        </div>

        <form onSubmit={handleSubmit} className="signup-form">
          {error && <div className="error-message">{error}</div>}

          <h3 className="section-title">Personal Details</h3>

          <div className="form-group">
            <label htmlFor="name">Full Name</label>
            <div className="input-container">
              <FaUser />
              <input
                type="text"
                id="name"
                placeholder="John Doe"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="username">Username</label>
            <div className="input-container">
              <FaAt />
              <input
                type="text"
                id="username"
                placeholder="johndoe_driver"
                value={formData.username}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <div className="input-container">
              <FaEnvelope />
              <input
                type="email"
                id="email"
                placeholder="john@example.com"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="phone">Phone Number</label>
            <div className="input-container">
              <FaPhone />
              <input
                type="tel"
                id="phone"
                placeholder="9876543210"
                value={formData.phone}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div className="input-container">
              <FaLock />
              <input
                type="password"
                id="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <h3 className="section-title">Vehicle Details</h3>

          <div className="form-group">
            <label htmlFor="vehicleMake">Vehicle Make</label>
            <div className="input-container">
              <FaCar />
              <input
                type="text"
                id="vehicleMake"
                placeholder="Suzuki / Hyundai"
                value={formData.vehicleMake}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="vehicleModel">Vehicle Model</label>
            <div className="input-container">
              <FaCar />
              <input
                type="text"
                id="vehicleModel"
                placeholder="Swift / i20"
                value={formData.vehicleModel}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="vehicleColor">Vehicle Color</label>
            <div className="input-container">
              <FaCar />
              <input
                type="text"
                id="vehicleColor"
                placeholder="White / Black"
                value={formData.vehicleColor}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="vehiclePlate">Plate Number</label>
            <div className="input-container">
              <FaCar />
              <input
                type="text"
                id="vehiclePlate"
                placeholder="MH12AB1234"
                value={formData.vehiclePlate}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <button type="submit" className="btn-primary signup-btn" disabled={isSubmitting}>
            {isSubmitting ? <div className="spinner"></div> : 'Register as Partner'}
          </button>
        </form>

        <div className="signup-footer">
          <p>
            Already have an account? <Link to="/login" className="auth-link">Login</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;
