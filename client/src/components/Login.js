import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

const Login = () => {
  const [rfid, setRfid] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();
  
  useEffect(() => {
    // Check if user is already logged in
    const user = localStorage.getItem('user');
    if (user) {
      navigate('/dashboard');
    }
  }, [navigate]);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!rfid) {
      setError('Please enter your RFID number');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const response = await axios.post('/api/users/login', { rfid });
      
      if (response.data.success) {
        localStorage.setItem('user', JSON.stringify(response.data.user));
        navigate('/dashboard');
      }
    } catch (error) {
      if (error.response && error.response.data) {
        setError(error.response.data.message);
      } else {
        setError('An error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="container">
      <div className="card" style={{ maxWidth: '500px', margin: '100px auto' }}>
        <h2 className="text-center">Smart Parking System</h2>
        <h3 className="text-center">Login</h3>
        
        {error && <div className="alert alert-danger">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="rfid">RFID Number</label>
            <input
              type="text"
              id="rfid"
              value={rfid}
              onChange={(e) => setRfid(e.target.value)}
              placeholder="Enter your RFID number"
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
        
        <p className="text-center mt-3">
          Don't have an account? <Link to="/register">Register</Link>
        </p>
      </div>
    </div>
  );
};

export default Login; 