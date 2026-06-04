import { Star } from 'lucide-react';

export default function StarRating({ rating, reviews, size = 'md' }) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`${sizeClasses[size]} ${
            star <= Math.round(rating)
              ? 'fill-yellow-400 text-yellow-400'
              : 'text-gray-300'
          }`}
        />
      ))}
      {reviews !== undefined && (
        <span className="text-sm text-gray-600 ml-2">({reviews})</span>
      )}
    </div>
  );
}
