import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ParkingLayout = ({ user }) => {
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchParkingSlots = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/slots`);
        if (response.data.success) {
          setSlots(response.data.slots);
        }
      } catch (error) {
        console.error('Error fetching parking slots:', error);
        setError('Failed to load parking slots');
      } finally {
        setLoading(false);
      }
    };

    fetchParkingSlots();

    // Refresh data every 10 seconds
    const interval = setInterval(fetchParkingSlots, 10000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return <div className="text-center"><p>Loading parking layout...</p></div>;
  }

  if (error) {
    return <div className="alert alert-danger">{error}</div>;
  }

  // Find the slot assigned to the current user
  const userSlot = slots.find(slot => 
    slot.userId && user && slot.userId.toString() === user._id
  );

  // Sort slots to ensure they're in numerical order
  const sortedSlots = [...slots].sort((a, b) => a.slotNumber - b.slotNumber);
  
  // Split slots into two sides (1-4 and 5-8)
  const leftSideSlots = sortedSlots.filter(slot => slot.slotNumber <= 4);
  const rightSideSlots = sortedSlots.filter(slot => slot.slotNumber > 4);

  return (
    <div className="card">
      <h3>Parking Layout</h3>
      <div className="parking-layout">
        <div className="parking-legend" style={{ marginBottom: '15px', display: 'flex', gap: '20px', justifyContent: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ width: '20px', height: '20px', backgroundColor: '#e8f5e9', border: '1px solid #1b5e20', marginRight: '5px' }}></div>
            <span>Available</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ width: '20px', height: '20px', backgroundColor: '#ffebee', border: '1px solid #b71c1c', marginRight: '5px' }}></div>
            <span>Occupied</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ width: '20px', height: '20px', backgroundColor: '#e3f2fd', border: '2px solid #0d47a1', marginRight: '5px' }}></div>
            <span>Your Slot</span>
          </div>
        </div>

        <div className="parking-container" style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0' }}>
          {/* Left side slots (1-4) */}
          <div className="parking-side" style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '45%' }}>
            {leftSideSlots.map(slot => {
              // Determine if this is the user's slot
              const isUserSlot = userSlot && slot.slotNumber === userSlot.slotNumber;
              
              // Determine slot styling based on status
              let slotStyle = {
                padding: '15px 10px',
                borderRadius: '5px',
                textAlign: 'center',
                border: '1px solid #ddd',
                position: 'relative',
                height: '60px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center'
              };
              
              if (isUserSlot) {
                slotStyle.backgroundColor = '#e3f2fd';
                slotStyle.borderColor = '#0d47a1';
                slotStyle.borderWidth = '2px';
                slotStyle.boxShadow = '0 0 8px rgba(13, 71, 161, 0.5)';
              } else if (slot.occupied) {
                slotStyle.backgroundColor = '#ffebee';
                slotStyle.borderColor = '#b71c1c';
              } else {
                slotStyle.backgroundColor = '#e8f5e9';
                slotStyle.borderColor = '#1b5e20';
              }

              return (
                <div key={slot.slotNumber} style={slotStyle}>
                  <div style={{ fontWeight: 'bold' }}>Slot {slot.slotNumber}</div>
                  <div style={{ fontSize: '12px' }}>
                    {slot.occupied ? 'Occupied' : 'Available'}
                    {isUserSlot && <span style={{ fontWeight: 'bold', display: 'block' }}>Your Car</span>}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Center driveway */}
          <div className="parking-driveway" style={{ 
            width: '10%', 
            backgroundColor: '#f0f0f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 'bold',
            color: '#555',
            borderRadius: '5px',
            fontSize: '12px',
            textAlign: 'center',
            padding: '0 5px'
          }}>
            D<br/>R<br/>I<br/>V<br/>E<br/>W<br/>A<br/>Y
          </div>

          {/* Right side slots (5-8) */}
          <div className="parking-side" style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '45%' }}>
            {rightSideSlots.map(slot => {
              // Determine if this is the user's slot
              const isUserSlot = userSlot && slot.slotNumber === userSlot.slotNumber;
              
              // Determine slot styling based on status
              let slotStyle = {
                padding: '15px 10px',
                borderRadius: '5px',
                textAlign: 'center',
                border: '1px solid #ddd',
                position: 'relative',
                height: '60px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center'
              };
              
              if (isUserSlot) {
                slotStyle.backgroundColor = '#e3f2fd';
                slotStyle.borderColor = '#0d47a1';
                slotStyle.borderWidth = '2px';
                slotStyle.boxShadow = '0 0 8px rgba(13, 71, 161, 0.5)';
              } else if (slot.occupied) {
                slotStyle.backgroundColor = '#ffebee';
                slotStyle.borderColor = '#b71c1c';
              } else {
                slotStyle.backgroundColor = '#e8f5e9';
                slotStyle.borderColor = '#1b5e20';
              }

              return (
                <div key={slot.slotNumber} style={slotStyle}>
                  <div style={{ fontWeight: 'bold' }}>Slot {slot.slotNumber}</div>
                  <div style={{ fontSize: '12px' }}>
                    {slot.occupied ? 'Occupied' : 'Available'}
                    {isUserSlot && <span style={{ fontWeight: 'bold', display: 'block' }}>Your Car</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: '15px', fontSize: '12px', color: '#555' }}>
          Parking Entrance
        </div>
      </div>
    </div>
  );
};

export default ParkingLayout;