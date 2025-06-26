import React from 'react';

const TransactionList = ({ transactions }) => {
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  if (!transactions || transactions.length === 0) {
    return <p className="empty-message">No transactions found.</p>;
  }

  return (
    <div className="transaction-list">
      {transactions.map((transaction) => (
        <div key={transaction._id} className="transaction-item">
          <div className="transaction-description">{transaction.description}</div>
          <div className={`transaction-amount ${transaction.amount > 0 ? 'amount-positive' : 'amount-negative'}`}>
            {transaction.amount > 0 ? '+' : ''}₹{Math.abs(transaction.amount).toFixed(2)}
          </div>
          <div className="transaction-date">{formatDate(transaction.timestamp)}</div>
        </div>
      ))}
    </div>
  );
};

export default TransactionList; 