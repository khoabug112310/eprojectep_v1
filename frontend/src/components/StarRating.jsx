import React from 'react';

const StarRating = ({ rating, onRatingChange, readonly = false, size = 'md' }) => {
  const [hoverRating, setHoverRating] = React.useState(0);
  
  const sizeClasses = {
    sm: 'fs-6',
    md: 'fs-4',
    lg: 'fs-5'
  };
  
  const handleClick = (value) => {
    if (!readonly && onRatingChange) {
      onRatingChange(value);
    }
  };
  
  const handleMouseEnter = (value) => {
    if (!readonly) {
      setHoverRating(value);
    }
  };
  
  const handleMouseLeave = () => {
    if (!readonly) {
      setHoverRating(0);
    }
  };
  
  return (
    <div className="d-flex">
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          className={`star ${sizeClasses[size]} ${
            star <= (hoverRating || rating) 
              ? 'text-warning' 
              : 'text-muted'
          } ${!readonly ? 'cursor-pointer' : ''}`}
          onClick={() => handleClick(star)}
          onMouseEnter={() => handleMouseEnter(star)}
          onMouseLeave={handleMouseLeave}
          style={{ 
            transition: 'color 0.2s',
            cursor: !readonly ? 'pointer' : 'default'
          }}
        >
          ★
        </span>
      ))}
    </div>
  );
};

export default StarRating;