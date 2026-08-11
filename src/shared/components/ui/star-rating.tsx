import React from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

const styles = {
  style38_1: "flex gap-2 items-center",
  style46_2: "transition-all duration-200 outline-none focus:scale-110",
  style47_3: "cursor-not-allowed opacity-50",
  style47_4: "hover:scale-125 cursor-pointer",
  sizeSm: "w-5 h-5",
  sizeMd: "w-7 h-7",
  sizeLg: "w-10 h-10",
  empty: "text-zinc-600 fill-transparent",
  emerald: "text-emerald-400 fill-emerald-400",
  amber: "text-amber-500 fill-amber-500",
  gold: "text-amber-400 fill-amber-400",
} as const;


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

  const sizeClasses = { sm: styles.sizeSm, md: styles.sizeMd, lg: styles.sizeLg };

  const getStarColor = (starValue: number) => {
    const isFilled = starValue <= rating;
    if (!isFilled) return styles.empty;
    
    if (color === 'emerald') return styles.emerald;
    if (color === 'amber') return styles.amber;
    return styles.gold;
  };

  return (
    <div className={styles.style38_1}>
      {stars.map((star) => (
        <button
          key={star}
          type="button"
          disabled={disabled}
          onClick={() => setRating(star)}
          className={cn(
            styles.style46_2,
            disabled ? styles.style47_3 : styles.style47_4
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
