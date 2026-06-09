import React from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StarRatingProps {
  rating: number;
  setRating: (rating: number) => void;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  color?: 'emerald' | 'amber' | 'gold' | string;
}

export function StarRating({
  rating,
  setRating,
  disabled = false,
  size = 'md',
  color = 'gold'
}: StarRatingProps) {
  const stars = [1, 2, 3, 4, 5];

  const sizeClasses = {
    sm: 'w-5 h-5',
    md: 'w-7 h-7',
    lg: 'w-10 h-10'
  };

  const getStarColor = (starValue: number) => {
    const isFilled = starValue <= rating;
    if (!isFilled) return 'text-zinc-600 fill-transparent';
    
    if (color === 'emerald') return 'text-emerald-400 fill-emerald-400';
    if (color === 'amber') return 'text-amber-500 fill-amber-500';
    return 'text-amber-400 fill-amber-400'; // Default gold
  };

  return (
    <div className="flex gap-2 items-center">
      {stars.map((star) => (
        <button
          key={star}
          type="button"
          disabled={disabled}
          onClick={() => setRating(star)}
          className={cn(
            "transition-all duration-200 outline-none focus:scale-110",
            disabled ? "cursor-not-allowed opacity-50" : "hover:scale-125 cursor-pointer"
          )}
        >
          <Star
            className={cn(sizeClasses[size], getStarColor(star))}
          />
        </button>
      ))}
    </div>
  );
}
