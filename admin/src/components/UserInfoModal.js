import React from 'react';

const UserInfoModal = ({ user, onClose }) => {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>User Information</h3>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>
        
        <div>
          <p><strong>Name:</strong> {user.name}</p>
          <p><strong>RFID:</strong> {user.rfid}</p>
          <p><strong>Wallet Balance:</strong> ₹{user.walletBalance?.toFixed(2)}</p>
          <p><strong>Slot Number:</strong> {user.slotNumber}</p>
          
          <button className="btn btn-primary btn-block" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserInfoModal; 