import React from 'react';
import { Link } from 'react-router-dom';
import { FaArrowRight, FaCar, FaClipboardList, FaRoute, FaUserTie } from 'react-icons/fa';
import './Landing.css';

const Landing = () => {
  return (
    <main className="landing-page">
      <header className="landing-topbar">
        <nav className="role-switch" aria-label="Drivexa apps">
          <a href="http://localhost:5176" className="role-link">
            <FaCar />
            Rider
          </a>
          <a href="http://localhost:5177" className="role-link active-role">
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
          <span className="hero-kicker">Driver app</span>
          <h1>Earn with every nearby ride.</h1>
          <p>
            Go online, receive requests, accept trips, and manage your ride history from one focused dashboard.
          </p>
          <div className="hero-actions">
            <Link to="/signup" className="btn-primary hero-cta">
              Start Driving
              <FaArrowRight />
            </Link>
            <Link to="/login" className="btn-secondary hero-secondary">
              Login
            </Link>
          </div>
        </div>

        <div className="driver-preview animate-fadeIn" aria-label="Drivexa driver preview">
          <div className="status-strip">
            <span>Online</span>
            <strong>4 requests nearby</strong>
          </div>
          <div className="driver-road">
            <span className="driver-car"><FaCar /></span>
            <span className="route-node node-one"></span>
            <span className="route-node node-two"></span>
            <span className="route-node node-three"></span>
          </div>
          <div className="preview-panel">
            <div>
              <span className="preview-label">Today</span>
              <strong>12 rides</strong>
            </div>
            <div>
              <span className="preview-label">Rating</span>
              <strong>4.9</strong>
            </div>
          </div>
        </div>
      </section>

      <section className="landing-cards" aria-label="Drivexa choices">
        <Link to="/dashboard" className="choice-card">
          <FaUserTie />
          <span>Driver Dashboard</span>
          <small>Go online and manage jobs</small>
        </Link>
        <Link to="/incoming" className="choice-card">
          <FaClipboardList />
          <span>Incoming Requests</span>
          <small>Review rider bookings</small>
        </Link>
        <a href="http://localhost:5173" className="choice-card">
          <FaRoute />
          <span>Book As Rider</span>
          <small>Open rider app</small>
        </a>
      </section>
    </main>
  );
};

export default Landing;
