import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FaCar, FaListUl, FaHistory, FaSignOutAlt, FaBars, FaTimes } from 'react-icons/fa';
import ThemeToggle from './ThemeToggle';
import './Navbar.css';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <NavLink to="/dashboard" className="navbar-brand" onClick={() => setMobileMenuOpen(false)}>
          <FaCar className="brand-icon" />
          <span className="gradient-text">Drivexa Driver</span>
        </NavLink>

        <div className="navbar-toggle" onClick={toggleMobileMenu}>
          {mobileMenuOpen ? <FaTimes /> : <FaBars />}
        </div>

        <ul className={`navbar-menu ${mobileMenuOpen ? 'active' : ''}`}>
          <li className="navbar-item">
            <NavLink
              to="/dashboard"
              className={({ isActive }) => `navbar-link ${isActive ? 'active' : ''}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              <FaCar /> Dashboard
            </NavLink>
          </li>
          <li className="navbar-item">
            <NavLink
              to="/incoming"
              className={({ isActive }) => `navbar-link ${isActive ? 'active' : ''}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              <FaListUl /> Incoming Requests
            </NavLink>
          </li>
          <li className="navbar-item">
            <NavLink
              to="/history"
              className={({ isActive }) => `navbar-link ${isActive ? 'active' : ''}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              <FaHistory /> Ride History
            </NavLink>
          </li>
          <li className="navbar-item" style={{ display: 'flex', alignItems: 'center' }}>
            <ThemeToggle />
          </li>
          {user && (
            <li className="navbar-user-info">
              <div className="status-indicator-wrapper">
                <span className={`status-dot ${user.isOnline ? 'online' : 'offline'}`}></span>
                <span className="user-greeting">Hi, {user.name}</span>
              </div>
              <button onClick={handleLogout} className="btn-logout" title="Logout">
                <FaSignOutAlt />
              </button>
            </li>
          )}
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;
