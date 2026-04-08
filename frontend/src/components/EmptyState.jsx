import React from 'react';

const EmptyState = ({ title, description, action = null }) => (
  <div className="empty-state">
    <h3>{title}</h3>
    <p>{description}</p>
    {action}
  </div>
);

export default EmptyState;
