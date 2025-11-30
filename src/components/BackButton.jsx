import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

const BackButton = ({ to, onClick, className, variant = 'ghost', children }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (to) {
      navigate(to);
    } else {
      navigate(-1);
    }
  };

  return (
    <Button
      variant={variant}
      onClick={handleClick}
      className={className || 'text-gray-600 hover:text-gray-900'}
    >
      <ArrowLeft className="h-4 w-4 mr-2" />
      {children || 'Back'}
    </Button>
  );
};

export default BackButton;

