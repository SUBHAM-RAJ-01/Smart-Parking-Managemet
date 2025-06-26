import React from 'react';
const Header = ({ user, onLogout }) => {
  return (
    <header className="header">
      <div className="container">
        <nav className="nav">
          <h1>Smart Parking System</h1>
          <div className="user-info">
            <span>Welcome, {user?.name || 'User'}</span>
            <button onClick={onLogout} className="btn btn-secondary" style={{ marginLeft: '10px' }}>
              Logout
            </button>
          </div>
        </nav>
      </div>
    </header>
  );
};
export default Header; 