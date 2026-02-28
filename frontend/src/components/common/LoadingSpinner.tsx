import React from 'react';

const LoadingSpinner: React.FC<{ message?: string }> = ({ message = 'Loading...' }) => {
  return (
    <div className="loading-spinner">
      <div className="spinner" />
      <p>{message}</p>
    </div>
  );
};

export default LoadingSpinner;
