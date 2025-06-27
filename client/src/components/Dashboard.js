import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Header from './Header';
import WalletInfo from './WalletInfo';
import ParkingInfo from './ParkingInfo';
import TransactionList from './TransactionList';
import PaymentModal from './PaymentModal';
import ReservationModal from './ReservationModal';
import ParkingLayout from './ParkingLayout';
const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [parkingInfo, setParkingInfo] = useState({
    totalSlots: 8,
    availableSlots: 0,
    occupiedSlots: 0
  });
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isReservationModalOpen, setIsReservationModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user'));
    if (!userData) {
      navigate('/');
      return;
    }
    setUser(userData); 
    // Fetch user data, transactions, and parking info
    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch updated user data
        const userResponse = await axios.get(`${process.env.REACT_APP_API_URL}/api/users/${userData._id}`);
        if (userResponse.data.success) {
          setUser(userResponse.data.user);
          localStorage.setItem('user', JSON.stringify(userResponse.data.user));
        } 
        // Fetch transactions
        const transactionsResponse = await axios.get(`${process.env.REACT_APP_API_URL}/api/users/${userData._id}/transactions`);
        if (transactionsResponse.data.success) {
          setTransactions(transactionsResponse.data.transactions);
        }
        // Fetch parking slots info
        const slotsResponse = await axios.get(`${process.env.REACT_APP_API_URL}/api/slots/status/available`);
        if (slotsResponse.data.success) {
          setParkingInfo({
            totalSlots: slotsResponse.data.totalSlots,
            availableSlots: slotsResponse.data.availableSlots,
            occupiedSlots: slotsResponse.data.occupiedSlots
          });
        } 
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    // Refresh data every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [navigate]);
  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/');
  };
  const handlePaymentSuccess = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
    setIsPaymentModalOpen(false);

    // Refresh transactions after payment
    const fetchTransactions = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/users/${user._id}/transactions`);
        if (response.data.success) {
          setTransactions(response.data.transactions);
        }
      } catch (error) {
        console.error('Error fetching transactions:', error);
      }
    };
    
    fetchTransactions();
  };
  
  if (loading && !user) {
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
      <Header user={user} onLogout={handleLogout} />
      
      <div className="container dashboard">
        {error && <div className="alert alert-danger">{error}</div>}
        
        <div className="row mb-4">
          <div className="col-md-4">
            <WalletInfo 
              user={user} 
              onAddMoney={() => setIsPaymentModalOpen(true)} 
            />
          </div>
          
          <div className="col-md-8">
            <ParkingInfo 
              parkingInfo={parkingInfo} 
              onReserve={() => setIsReservationModalOpen(true)} 
            />
          </div>
        </div>
        
        <div className="row mb-4">
          <div className="col-md-12">
            <ParkingLayout user={user} />
          </div>
        </div>
        
        <div className="row">
          <div className="col-md-12">
            <div className="card">
              <h3>Transaction History</h3>
              <TransactionList transactions={transactions} />
            </div>
          </div>
        </div>
      </div>
      
      {isPaymentModalOpen && (
        <PaymentModal 
          user={user}
          onClose={() => setIsPaymentModalOpen(false)}
          onPaymentSuccess={handlePaymentSuccess}
        />
      )}
      
      {isReservationModalOpen && (
        <ReservationModal 
          user={user}
          onClose={() => setIsReservationModalOpen(false)}
        />
      )}
    </>
  );
};
export default Dashboard; 