import React from 'react';

const SlotTable = ({ slots, onViewUser, onForceExit }) => {
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  return (
    <div className="table-container">
      <table>
        <thead>
          <tr>
            <th>Slot Number</th>
            <th>Status</th>
            <th>Entry Time</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {slots.map((slot) => (
            <tr key={slot._id}>
              <td>{slot.slotNumber}</td>
              <td>
                <span className={`badge ${slot.occupied ? 'badge-danger' : 'badge-success'}`}>
                  {slot.occupied ? 'Occupied' : 'Available'}
                </span>
              </td>
              <td>{formatDate(slot.entryTime)}</td>
              <td>
                {slot.occupied ? (
                  <>
                    <button
                      className="btn btn-secondary"
                      style={{ marginRight: '10px' }}
                      onClick={() => onViewUser(slot.slotNumber)}
                    >
                      View User
                    </button>
                    <button
                      className="btn btn-danger"
                      onClick={() => onForceExit(slot.slotNumber)}
                    >
                      Force Exit
                    </button>
                  </>
                ) : (
                  <span>No actions available</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default SlotTable; 