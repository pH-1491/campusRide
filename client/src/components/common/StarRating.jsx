import { Star } from 'lucide-react';

export default function StarRating({ value, onChange, readonly = false, size = 'md' }) {
  const sizes = { sm: 'w-3.5 h-3.5', md: 'w-5 h-5', lg: 'w-7 h-7' };
  const sz = sizes[size] || sizes.md;

  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(star => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          onClick={() => onChange?.(star)}
          className={`transition-transform ${!readonly ? 'hover:scale-110 cursor-pointer' : 'cursor-default'}`}
        >
          <Star
            className={`${sz} transition-colors ${
              star <= value ? 'fill-yellow-400 text-yellow-400' : 'text-slate-600'
            }`}
          />
        </button>
      ))}
    </div>
  );
}
