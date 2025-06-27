import React, { useState } from 'react';
import axios from 'axios';
import './PaymentModal.css';
import { useNavigate } from 'react-router-dom';

const apiUrl = process.env.REACT_APP_API_URL || '';

const PaymentModal = ({ user, onClose, onPaymentSuccess }) => {
  const [amount, setAmount] = useState(100);
  const [paymentMethod, setPaymentMethod] = useState('CARD');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState(1); // Step 1: Amount, Step 2: Payment Method, Step 3: Confirmation
  const [cardDetails, setCardDetails] = useState({
    cardNumber: '',
    cardName: '',
    expiry: '',
    cvv: ''
  });
  const [upiId, setUpiId] = useState('');
  const [bankName, setBankName] = useState('');
  const navigate = useNavigate();

  const handleAmountSubmit = (e) => {
    e.preventDefault();
    if (!amount || amount <= 0) {
      setError('Please enter a valid amount');
      return;
    }
    setError('');
    setStep(2);
  };

  const handlePaymentMethodSubmit = (e) => {
    e.preventDefault();
    // Validate based on payment method
    if (paymentMethod === 'CARD') {
      if (!cardDetails.cardNumber || !cardDetails.cardName || !cardDetails.expiry || !cardDetails.cvv) {
        setError('Please fill in all card details');
        return;
      }
    } else if (paymentMethod === 'UPI' && !upiId) {
      setError('Please enter UPI ID');
      return;
    } else if (paymentMethod === 'NETBANKING' && !bankName) {
      setError('Please select a bank');
      return;
    }
    setError('');
    setStep(3);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const response = await axios.post(`${apiUrl}/api/users/${user._id}/wallet/add`, {
        amount,
        paymentMethod
      });
      
      if (response.data.success) {
        onPaymentSuccess(response.data.user);
        onClose();
        navigate('/dashboard');
      }
    } catch (error) {
      if (error.response && error.response.data) {
        setError(error.response.data.message);
      } else {
        setError('An error occurred. Please try again.');
      }
      setStep(2);
    } finally {
      setLoading(false);
    }
  };

  const renderStepOne = () => (
    <form onSubmit={handleAmountSubmit}>
      <div className="amount-input-container">
        <span className="currency-symbol">₹</span>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(Number(e.target.value))}
          min="1"
          className="amount-input"
          disabled={loading}
          autoFocus
        />
      </div>
      
      <div className="quick-amount-buttons">
        <button type="button" onClick={() => setAmount(100)} className="quick-amount-btn">₹100</button>
        <button type="button" onClick={() => setAmount(200)} className="quick-amount-btn">₹200</button>
        <button type="button" onClick={() => setAmount(500)} className="quick-amount-btn">₹500</button>
        <button type="button" onClick={() => setAmount(1000)} className="quick-amount-btn">₹1000</button>
      </div>
      
      <button type="submit" className="btn btn-primary btn-block">
        Continue
      </button>
    </form>
  );

  const renderStepTwo = () => (
    <form onSubmit={handlePaymentMethodSubmit}>
      <div className="payment-methods">
        <div 
          className={`payment-method-card ${paymentMethod === 'CARD' ? 'selected' : ''}`}
          onClick={() => setPaymentMethod('CARD')}
        >
          <div className="payment-icon card-icon">💳</div>
          <span>Card</span>
        </div>
        
        <div 
          className={`payment-method-card ${paymentMethod === 'UPI' ? 'selected' : ''}`}
          onClick={() => setPaymentMethod('UPI')}
        >
          <div className="payment-icon upi-icon">📱</div>
          <span>UPI</span>
        </div>
        
        <div 
          className={`payment-method-card ${paymentMethod === 'NETBANKING' ? 'selected' : ''}`}
          onClick={() => setPaymentMethod('NETBANKING')}
        >
          <div className="payment-icon netbanking-icon">🏦</div>
          <span>Net Banking</span>
        </div>
      </div>
      
      {paymentMethod === 'CARD' && (
        <div className="card-details">
          <div className="form-group">
            <label>Card Number</label>
            <input
              type="text"
              placeholder="1234 5678 9012 3456"
              value={cardDetails.cardNumber}
              onChange={(e) => setCardDetails({...cardDetails, cardNumber: e.target.value})}
              maxLength="19"
            />
          </div>
          
          <div className="form-group">
            <label>Name on Card</label>
            <input
              type="text"
              placeholder="John Doe"
              value={cardDetails.cardName}
              onChange={(e) => setCardDetails({...cardDetails, cardName: e.target.value})}
            />
          </div>
          
          <div className="card-row">
            <div className="form-group expiry">
              <label>Expiry</label>
              <input
                type="text"
                placeholder="MM/YY"
                value={cardDetails.expiry}
                onChange={(e) => setCardDetails({...cardDetails, expiry: e.target.value})}
                maxLength="5"
              />
            </div>
            
            <div className="form-group cvv">
              <label>CVV</label>
              <input
                type="password"
                placeholder="123"
                value={cardDetails.cvv}
                onChange={(e) => setCardDetails({...cardDetails, cvv: e.target.value})}
                maxLength="3"
              />
            </div>
          </div>
        </div>
      )}
      
      {paymentMethod === 'UPI' && (
        <div className="upi-details">
          <div className="form-group">
            <label>UPI ID</label>
            <input
              type="text"
              placeholder="yourname@upi"
              value={upiId}
              onChange={(e) => setUpiId(e.target.value)}
            />
          </div>
          <div className="upi-apps">
            <div className="upi-app">
              <div className="upi-app-icon">G</div>
              <span>GPay</span>
            </div>
            <div className="upi-app">
              <div className="upi-app-icon">P</div>
              <span>PhonePe</span>
            </div>
            <div className="upi-app">
              <div className="upi-app-icon">P</div>
              <span>Paytm</span>
            </div>
          </div>
        </div>
      )}
      
      {paymentMethod === 'NETBANKING' && (
        <div className="netbanking-details">
          <div className="form-group">
            <label>Select Bank</label>
            <select 
              value={bankName} 
              onChange={(e) => setBankName(e.target.value)}
              className="bank-select"
            >
              <option value="">Select a bank</option>
              <option value="SBI">State Bank of India</option>
              <option value="HDFC">HDFC Bank</option>
              <option value="ICICI">ICICI Bank</option>
              <option value="Axis">Axis Bank</option>
              <option value="PNB">Punjab National Bank</option>
            </select>
          </div>
        </div>
      )}
      
      <div className="button-group">
        <button type="button" className="btn btn-secondary" onClick={() => setStep(1)}>
          Back
        </button>
        <button type="submit" className="btn btn-primary">
          Continue
        </button>
      </div>
    </form>
  );

  const renderStepThree = () => (
    <div className="confirmation-step">
      <div className="confirmation-icon">✓</div>
      <h3>Confirm Payment</h3>
      
      <div className="confirmation-details">
        <div className="confirmation-row">
          <span>Amount:</span>
          <span className="confirmation-value">₹{amount.toFixed(2)}</span>
        </div>
        <div className="confirmation-row">
          <span>Payment Method:</span>
          <span className="confirmation-value">{paymentMethod}</span>
        </div>
        {paymentMethod === 'CARD' && (
          <div className="confirmation-row">
            <span>Card Number:</span>
            <span className="confirmation-value">
              {'xxxx-xxxx-xxxx-' + cardDetails.cardNumber.slice(-4)}
            </span>
          </div>
        )}
        {paymentMethod === 'UPI' && (
          <div className="confirmation-row">
            <span>UPI ID:</span>
            <span className="confirmation-value">{upiId}</span>
          </div>
        )}
        {paymentMethod === 'NETBANKING' && (
          <div className="confirmation-row">
            <span>Bank:</span>
            <span className="confirmation-value">{bankName}</span>
          </div>
        )}
      </div>
      
      <div className="button-group">
        <button type="button" className="btn btn-secondary" onClick={() => setStep(2)}>
          Back
        </button>
        <button 
          type="button" 
          className="btn btn-primary"
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? 'Processing...' : 'Pay Now'}
        </button>
      </div>
    </div>
  );

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal payment-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>
            {step === 1 && 'Add Money to Wallet'}
            {step === 2 && 'Select Payment Method'}
            {step === 3 && 'Confirm Payment'}
          </h3>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>
        
        <div className="payment-steps">
          <div className={`step ${step >= 1 ? 'active' : ''}`}>1</div>
          <div className="step-line"></div>
          <div className={`step ${step >= 2 ? 'active' : ''}`}>2</div>
          <div className="step-line"></div>
          <div className={`step ${step >= 3 ? 'active' : ''}`}>3</div>
        </div>
        
        {error && <div className="alert alert-danger">{error}</div>}
        
        <div className="payment-content">
          {step === 1 && renderStepOne()}
          {step === 2 && renderStepTwo()}
          {step === 3 && renderStepThree()}
        </div>
      </div>
    </div>
  );
};

export default PaymentModal; 