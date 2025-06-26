import React from 'react';

const WalletInfo = ({ user, onAddMoney }) => {
  return (
    <div className="card wallet-info">
      <h3>Wallet Balance</h3>
      <p className="balance">₹{user?.walletBalance?.toFixed(2) || '0.00'}</p>
      <button onClick={onAddMoney} className="btn btn-primary">
        Add Money
      </button>
    </div>
  );
};

export default WalletInfo; 