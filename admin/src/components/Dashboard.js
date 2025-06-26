import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Header from './Header';
import SlotTable from './SlotTable';
import UserInfoModal from './UserInfoModal';

const Dashboard = () => {
  const [slots, setSlots] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dashboardStats, setDashboardStats] = useState({
    availableSlots: 0,
    occupiedSlots: 0,
    totalSlots: 0,
    totalRevenue: 0,
    dailyRevenue: 0,
    totalUsers: 0,
    recentTransactions: []
  });
  
  const navigate = useNavigate();
  
  useEffect(() => {
    const adminUser = JSON.parse(localStorage.getItem('adminUser'));
    if (!adminUser) {
      navigate('/');
      return;
    }
    
    fetchSlots();
    fetchDashboardSummary();
    
    // Refresh data every 10 seconds
    const interval = setInterval(() => {
      fetchSlots();
      fetchDashboardSummary();
    }, 10000);
    
    return () => clearInterval(interval);
  }, [navigate]);
  
  const fetchDashboardSummary = async () => {
    try {
      const response = await axios.get('/api/admin/dashboard/summary');
      
      if (response.data.success) {
        setDashboardStats(response.data);
      }
    } catch (error) {
      console.error('Error fetching dashboard summary:', error);
    }
  };
  
  const fetchSlots = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/slots');
      
      if (response.data.success) {
        setSlots(response.data.slots);
      }
    } catch (error) {
      console.error('Error fetching slots:', error);
      setError('Failed to load parking slots');
    } finally {
      setLoading(false);
    }
  };
  
  const handleForceExit = async (slotNumber) => {
    try {
      const response = await axios.post(`/api/admin/slots/${slotNumber}/force-exit`);
      
      if (response.data.success) {
        // Update slots after force exit
        fetchSlots();
        fetchDashboardSummary();
      }
    } catch (error) {
      console.error('Error forcing exit:', error);
      alert('Failed to force exit vehicle');
    }
  };
  
  const handleViewUser = async (slotNumber) => {
    try {
      const response = await axios.get(`/api/slots/${slotNumber}/details`);
      
      if (response.data.success && response.data.user) {
        setSelectedUser({
          ...response.data.user,
          slotNumber,
          entryTime: response.data.slot.entryTime
        });
        setIsUserModalOpen(true);
      } else {
        alert('No user information available for this slot');
      }
    } catch (error) {
      console.error('Error fetching user details:', error);
      alert('Failed to fetch user information');
    }
  };
  
  const handleLogout = () => {
    localStorage.removeItem('adminUser');
    navigate('/');
  };
  
  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };
  
  if (loading && slots.length === 0) {
    return (
      <div className="container">
        <div className="text-center" style={{ marginTop: '100px' }}>
          <h2>Loading...</h2>
        </div>
      </div>
    );
  }
  
  return (
    <>
      <Header onLogout={handleLogout} />
      
      <div className="container" style={{ 
        background: 'linear-gradient(135deg, #f5f7fa 0%, #f8f9fa 100%)',
        padding: '20px',
        borderRadius: '10px',
        marginTop: '20px'
      }}>
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2 style={{ fontWeight: 'bold', color: '#333' }}>
            <i className="fas fa-tachometer-alt me-2"></i> Dashboard Overview
          </h2>
          <div>
            <span className="badge bg-primary me-2">
              <i className="fas fa-sync-alt me-1"></i> Last updated: {new Date().toLocaleTimeString()}
            </span>
          </div>
        </div>
        
        {error && <div className="alert alert-danger">{error}</div>}
        
        <div className="d-flex flex-wrap" style={{ gap: '15px', marginBottom: '20px' }}>
          <div className="dashboard-card-container" style={{ flex: '1 0 calc(33.33% - 15px)', minWidth: '180px' }}>
            <div className="card dashboard-card" style={{ 
              backgroundColor: '#e3f2fd', 
              color: '#0d47a1',
              height: '110px'
            }}>
              <div className="card-body" style={{ padding: '15px' }}>
                <i className="fas fa-parking icon"></i>
                <h5 className="card-title">Available</h5>
                <h2 className="card-value">{dashboardStats.availableSlots || 0}</h2>
              </div>
            </div>
          </div>
          <div className="dashboard-card-container" style={{ flex: '1 0 calc(33.33% - 15px)', minWidth: '180px' }}>
            <div className="card dashboard-card" style={{ 
              backgroundColor: '#ffebee', 
              color: '#b71c1c',
              height: '110px'
            }}>
              <div className="card-body" style={{ padding: '15px' }}>
                <i className="fas fa-car icon"></i>
                <h5 className="card-title">Occupied</h5>
                <h2 className="card-value">{dashboardStats.occupiedSlots || 0}</h2>
              </div>
            </div>
          </div>
          <div className="dashboard-card-container" style={{ flex: '1 0 calc(33.33% - 15px)', minWidth: '180px' }}>
            <div className="card dashboard-card" style={{ 
              backgroundColor: '#fff3e0', 
              color: '#e65100',
              height: '110px'
            }}>
              <div className="card-body" style={{ padding: '15px' }}>
                <i className="fas fa-percentage icon"></i>
                <h5 className="card-title">Occupancy</h5>
                <h2 className="card-value">
                  {dashboardStats.totalSlots ? 
                    Math.round((dashboardStats.occupiedSlots / dashboardStats.totalSlots) * 100) : 0}%
                </h2>
              </div>
            </div>
          </div>
          
          <div className="dashboard-card-container" style={{ flex: '1 0 calc(33.33% - 15px)', minWidth: '180px' }}>
            <div className="card dashboard-card" style={{ 
              backgroundColor: '#e8f5e9', 
              color: '#1b5e20',
              height: '110px'
            }}>
              <div className="card-body" style={{ padding: '15px' }}>
                <i className="fas fa-rupee-sign icon"></i>
                <h5 className="card-title">Daily Revenue</h5>
                <h2 className="card-value" style={{ fontSize: '1.5rem' }}>₹{dashboardStats.dailyRevenue?.toFixed(0) || '0'}</h2>
              </div>
            </div>
          </div>
          <div className="dashboard-card-container" style={{ flex: '1 0 calc(33.33% - 15px)', minWidth: '180px' }}>
            <div className="card dashboard-card" style={{ 
              backgroundColor: '#e1f5fe', 
              color: '#01579b',
              height: '110px'
            }}>
              <div className="card-body" style={{ padding: '15px' }}>
                <i className="fas fa-chart-line icon"></i>
                <h5 className="card-title">Total Revenue</h5>
                <h2 className="card-value" style={{ fontSize: '1.5rem' }}>₹{dashboardStats.totalRevenue?.toFixed(0) || '0'}</h2>
              </div>
            </div>
          </div>
          <div className="dashboard-card-container" style={{ flex: '1 0 calc(33.33% - 15px)', minWidth: '180px' }}>
            <div className="card dashboard-card" style={{ 
              backgroundColor: '#f3e5f5', 
              color: '#4a148c',
              height: '110px'
            }}>
              <div className="card-body" style={{ padding: '15px' }}>
                <i className="fas fa-users icon"></i>
                <h5 className="card-title">Total Users</h5>
                <h2 className="card-value">{dashboardStats.totalUsers || 0}</h2>
              </div>
            </div>
          </div>
        </div>
        
        <div className="row mb-4">
          <div className="col-md-12">
            <div className="card table-card" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
              <div className="card-body">
                <h5 className="card-title" style={{ fontWeight: 'bold', marginBottom: '1rem' }}>
                  <i className="fas fa-exchange-alt me-2"></i>Recent Transactions
                </h5>
                <div className="scrollable-table">
                  <table className="table table-sm table-striped">
                    <thead>
                      <tr>
                        <th>Transaction ID</th>
                        <th>Type</th>
                        <th>Amount</th>
                        <th>Date & Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dashboardStats.recentTransactions && dashboardStats.recentTransactions.length > 0 ? (
                        dashboardStats.recentTransactions.slice(0, 5).map((transaction) => (
                          <tr key={transaction._id}>
                            <td>{transaction.transactionId}</td>
                            <td>
                              {transaction.type === 'PARKING_FEE' ? (
                                <span className="badge" style={{ backgroundColor: '#ffebee', color: '#b71c1c' }}>Parking Fee</span>
                              ) : (
                                <span className="badge" style={{ backgroundColor: '#e8f5e9', color: '#1b5e20' }}>Wallet Topup</span>
                              )}
                            </td>
                            <td className={transaction.type === 'PARKING_FEE' ? 'text-danger' : 'text-success'}>
                              ₹{Math.abs(transaction.amount).toFixed(2)}
                            </td>
                            <td>{formatDate(transaction.timestamp)}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="4" className="text-center">No recent transactions</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="card table-card mb-4" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <div className="card-body">
            <h3 style={{ fontWeight: 'bold', marginBottom: '1rem' }}>
              <i className="fas fa-th me-2"></i>Parking Slots
            </h3>
            <SlotTable 
              slots={slots} 
              onViewUser={handleViewUser}
              onForceExit={handleForceExit}
            />
          </div>
        </div>
      </div>
      
      {isUserModalOpen && selectedUser && (
        <UserInfoModal
          user={selectedUser}
          onClose={() => setIsUserModalOpen(false)}
        />
      )}
    </>
  );
};

export default Dashboard; 