import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FaCar, FaHistory, FaSignOutAlt, FaBars, FaTimes } from 'react-icons/fa';
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
        <NavLink to="/book" className="navbar-brand" onClick={() => setMobileMenuOpen(false)}>
          <FaCar className="brand-icon" />
          <span className="gradient-text">Drivexa</span>
        </NavLink>

        <div className="navbar-toggle" onClick={toggleMobileMenu}>
          {mobileMenuOpen ? <FaTimes /> : <FaBars />}
        </div>

        <ul className={`navbar-menu ${mobileMenuOpen ? 'active' : ''}`}>
          <li className="navbar-item">
            <NavLink
              to="/book"
              className={({ isActive }) => `navbar-link ${isActive ? 'active' : ''}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              <FaCar /> Book Ride
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
              <span className="user-greeting">Hi, {user.name}</span>
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
