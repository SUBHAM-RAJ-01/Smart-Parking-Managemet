import React from 'react';

const Header = ({ onLogout }) => {
  return (
    <header className="header">
      <div className="container">
        <nav className="nav">
          <h1>Smart Parking System - Admin Panel</h1>
          <button onClick={onLogout} className="btn btn-secondary">
            Logout
          </button>
        </nav>
      </div>
    </header>
  );
};

export default Header; 