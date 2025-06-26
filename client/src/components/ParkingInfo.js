import React from 'react';

const ParkingInfo = ({ parkingInfo, onReserve }) => {
  const { totalSlots, availableSlots } = parkingInfo;
  
  return (
    <div className="card">
      <h3>Parking Information</h3>
      <div style={{ padding: '15px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
          <span>Parking Area:</span>
          <span>RVCE Ground Parking</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
          <span>Available Slots:</span>
          <span>{availableSlots}/{totalSlots}</span>
        </div>
        <button 
          onClick={onReserve} 
          className="btn btn-primary"
          style={{ width: '100%' }}
          disabled={availableSlots === 0}
        >
          {availableSlots === 0 ? 'No Slots Available' : 'Reserve Slot'}
        </button>
      </div>
    </div>
  );
};

export default ParkingInfo; 