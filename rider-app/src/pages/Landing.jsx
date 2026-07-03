import React from 'react';
import { Link } from 'react-router-dom';
import { FaArrowRight, FaCar, FaMapMarkerAlt, FaShieldAlt, FaUserTie } from 'react-icons/fa';
import './Landing.css';

const Landing = () => {
  return (
    <main className="landing-page">
      <header className="landing-topbar">
        <nav className="role-switch" aria-label="Drivexa apps">
          <a href="http://localhost:5176" className="role-link active-role">
            <FaCar />
            Rider
          </a>
          <a href="http://localhost:5177" className="role-link">
            <FaUserTie />
            Driver
          </a>
        </nav>

        <div className="landing-actions">
          <span className="landing-brand">Drivexa</span>
          <Link to="/login" className="landing-login">Login</Link>
          <Link to="/signup" className="landing-signup">Sign Up</Link>
        </div>
      </header>

      <section className="landing-hero">
        <div className="hero-copy animate-slideUp">
          <span className="hero-kicker">Rider app</span>
          <h1>Book a ride without the wait.</h1>
          <p>
            Choose your pickup, set your destination, and connect with nearby drivers in real time.
          </p>
          <div className="hero-actions">
            <Link to="/signup" className="btn-primary hero-cta">
              Start Riding
              <FaArrowRight />
            </Link>
            <Link to="/login" className="btn-secondary hero-secondary">
              Login
            </Link>
          </div>
        </div>

        <div className="ride-preview animate-fadeIn" aria-label="Drivexa trip preview">
          <div className="preview-map">
            <div className="route-line"></div>
            <span className="map-pin pickup-pin"><FaMapMarkerAlt /></span>
            <span className="map-pin drop-pin"><FaMapMarkerAlt /></span>
            <span className="moving-car"><FaCar /></span>
          </div>
          <div className="preview-panel">
            <div>
              <span className="preview-label">Nearby driver</span>
              <strong>3 min away</strong>
            </div>
            <div>
              <span className="preview-label">Estimated fare</span>
              <strong>Rs. 148</strong>
            </div>
          </div>
        </div>
      </section>

      <section className="landing-cards" aria-label="Drivexa choices">
        <Link to="/book" className="choice-card">
          <FaCar />
          <span>Book Ride</span>
          <small>Open rider dashboard</small>
        </Link>
        <a href="http://localhost:5174" className="choice-card">
          <FaUserTie />
          <span>Drive With Us</span>
          <small>Open driver app</small>
        </a>
        <div className="choice-card">
          <FaShieldAlt />
          <span>Live Tracking</span>
          <small>Follow every trip</small>
        </div>
      </section>
    </main>
  );
};

export default Landing;
