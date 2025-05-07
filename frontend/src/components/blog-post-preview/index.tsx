import React from "react";
import type { Post } from "@/types/blog";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import styles from "./styles.module.css";
import PostRating from "@/components/post-rating";
import Link from "next/link";
import Image from "next/image";

/**
 * Превью поста для главной страницы (стиль Read WP, RU).
 */
interface BlogPostPreviewProps {
  post: Post;
  searchQuery?: string;
}

// Функция для подсветки текста
const highlightText = (text: string, query: string) => {
  if (!query || !text) return text;
  const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}\[\]\\()|]/g, "\\$&")})`, 'gi'));
  return (
    <>
      {parts.map((part, index) =>
        part.toLowerCase() === query.toLowerCase() ? (
          <mark key={index} className="bg-yellow-200 text-black px-0 py-0 rounded">
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </>
  );
};

const BlogPostPreview: React.FC<BlogPostPreviewProps> = ({ post, searchQuery }) => {
  const imageUrl = typeof post.image === 'string' ? post.image : post.image?.url;

  // Формат даты: 2 мая 2025 года
  const date = post.first_published_at
    ? format(new Date(post.first_published_at), "d MMMM yyyy 'года'", { locale: ru })
    : "";
  // Тег
  const tag = post.tags[0];
  // Анонс
  let rawExcerpt = post.description || "";
  if (rawExcerpt.length > 180) {
    rawExcerpt = rawExcerpt.slice(0, 180) + '...';
  }

  const titleContent = searchQuery ? highlightText(post.title, searchQuery) : post.title;
  const excerptContent = searchQuery ? highlightText(rawExcerpt, searchQuery) : rawExcerpt;

  return (
    <article className="flex flex-col items-center max-w-4xl w-full mx-auto mb-20">
      <h2
        className={`${styles.titleLinkContainer} font-lora text-gray-800 text-2xl md:text-3xl font-bold text-center mb-2 leading-tight`}
      >
        <Link
          href={`/posts/${post.slug}`}
          className={`${styles.titleLink} ${styles.bgHoverClone} inline-block no-underline text-gray-800 rounded focus:outline-none hover:text-accentDark transition-colors duration-200`}
        >
          {titleContent}
        </Link>
      </h2>
      <div className="flex flex-wrap items-center justify-center gap-x-1 text-lg text-gray-400 text-center mb-2 leading-normal">
        <span className="text-gray-500">пост в</span> 
        {post.tags && post.tags.length > 0 ? (
           post.tags.map((tag) => (
             <React.Fragment key={tag.id}>
               <Link
                 href={`/tags/${tag.slug}`}
                 className={`${styles.tagLink} ${styles.hoverCloneEffect} inline-block no-underline text-gray-500 hover:text-accentDark transition-colors duration-200`}
               >
                 #{tag.name}
               </Link>
             </React.Fragment>
           ))
         ) : (
          <span className="text-gray-500">блоге</span>
        )}
        <Link
          href={`/archive/${post.first_published_at ? new Date(post.first_published_at).getFullYear() : ''}/${post.first_published_at ? String(new Date(post.first_published_at).getMonth() + 1).padStart(2, '0') : ''}/${post.first_published_at ? String(new Date(post.first_published_at).getDate()).padStart(2, '0') : ''}`}
          className={`${styles.dateLink} ${styles.hoverCloneEffect} inline-block no-underline text-gray-400 hover:text-accentDark transition-colors duration-200`}
        >
          {date}
        </Link>
        {typeof post.average_rating === "number" && (
          <PostRating value={post.average_rating} />
        )}
      </div>
      {imageUrl && (
        <Link href={`/posts/${post.slug}`} className="block w-full max-w-[800px] mx-auto mb-4 group" aria-label={`Читать статью: ${post.title}`}>
          <Image
            src={imageUrl}
            alt={post.title}
            width={800}
            height={400}
            className="w-full h-auto object-cover rounded shadow group-hover:opacity-90 transition-opacity duration-200"
            style={{ maxHeight: '400px' }}
            priority={false}
            loading="lazy"
          />
        </Link>
      )}
      {rawExcerpt && (
        <div className="text-center text-base text-text mb-4 font-serif">
          {excerptContent}
        </div>
      )}
      <Link
        href={`/posts/${post.slug}`}
        className={`${styles.readLink} ${styles.hoverCloneEffect} inline-block font-bold text-base tracking-wider uppercase no-underline text-gray-800 hover:text-accentDark transition-colors duration-200 pb-1 mt-1`}
        aria-label={`Читать подробнее о ${post.title}`}
      >
        Читать <span className="ml-1">→</span>
      </Link>
    </article>
  );
};

export default BlogPostPreview;