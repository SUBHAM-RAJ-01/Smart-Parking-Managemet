import React from 'react';

const ReservationModal = ({ user, onClose }) => {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Slot Reservation</h3>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>
        
        <div>
          <p>To reserve a parking slot, please visit the parking area and scan your RFID card at the entry gate.</p>
          <p>Your RFID: <strong>{user?.rfid}</strong></p>
          <p>The system will automatically assign you an available slot.</p>
          
          <div style={{ marginTop: '20px' }}>
            <button className="btn btn-primary btn-block" onClick={onClose}>
              OK
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReservationModal; 