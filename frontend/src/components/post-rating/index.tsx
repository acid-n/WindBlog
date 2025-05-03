import React from "react";

/**
 * Компонент рейтинга поста (только просмотр, без голосования).
 */
interface PostRatingProps {
  value: number; // средний рейтинг (1-5)
}

const PostRating: React.FC<PostRatingProps> = ({ value }) => {
  const stars = Array.from({ length: 5 }, (_, i) => i + 1);
  return (
    <span className="flex items-center gap-0.5">
      {stars.map((star) => (
        <svg
          key={star}
          className={`w-4 h-4 ${star <= Math.round(value) ? "text-yellow-400" : "text-gray-300"}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.967a1 1 0 00.95.69h4.175c.969 0 1.371 1.24.588 1.81l-3.38 2.455a1 1 0 00-.364 1.118l1.287 3.966c.3.922-.755 1.688-1.54 1.118l-3.38-2.455a1 1 0 00-1.175 0l-3.38 2.455c-.784.57-1.838-.196-1.54-1.118l1.287-3.966a1 1 0 00-.364-1.118L2.05 9.394c-.783-.57-.38-1.81.588-1.81h4.175a1 1 0 00.95-.69l1.286-3.967z" />
        </svg>
      ))}
      <span className="ml-1 text-xs text-gray-500">{value.toFixed(1)}</span>
    </span>
  );
};

export default PostRating;
