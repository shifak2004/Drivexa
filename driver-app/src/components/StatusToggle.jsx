import React from 'react';
import './StatusToggle.css';

const StatusToggle = ({ isOnline, onToggle, disabled }) => {
  return (
    <div className="status-toggle-wrapper">
      <span className={`status-label-text ${isOnline ? 'online' : 'offline'}`}>
        {isOnline ? 'ONLINE' : 'OFFLINE'}
      </span>
      <button
        type="button"
        className={`status-switch ${isOnline ? 'active' : ''}`}
        onClick={onToggle}
        disabled={disabled}
      >
        <span className="status-switch-handle"></span>
      </button>
    </div>
  );
};

export default StatusToggle;
