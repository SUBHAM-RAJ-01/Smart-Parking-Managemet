import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Login = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();
  
  const { username, password } = formData;
  
  useEffect(() => {
    // Check if admin is already logged in
    const adminUser = localStorage.getItem('adminUser');
    if (adminUser) {
      navigate('/dashboard');
    }
  }, [navigate]);
  
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!username || !password) {
      setError('Please enter both username and password');
      return;
    }
    
    // For demo purposes, use a hardcoded admin login
    // In production, this should be replaced with a proper API call
    if (username === 'admin' && password === 'admin123') {
      const adminUser = {
        id: 'admin1',
        name: 'Admin User',
        isAdmin: true
      };
      
      localStorage.setItem('adminUser', JSON.stringify(adminUser));
      navigate('/dashboard');
    } else {
      setError('Invalid credentials');
    }
  };
  
  return (
    <div className="container">
      <div className="card" style={{ maxWidth: '500px', margin: '100px auto' }}>
        <h2 className="text-center">Smart Parking System</h2>
        <h3 className="text-center">Admin Login</h3>
        
        {error && <div className="alert alert-danger">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={handleChange}
              placeholder="Enter username"
              disabled={loading}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={handleChange}
              placeholder="Enter password"
              disabled={loading}
            />
          </div>
          
          <button 
            type="submit" 
            className="btn btn-primary btn-block"
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login; 