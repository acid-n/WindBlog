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
  const parts = text.split(
    new RegExp(`(${query.replace(/[.*+?^${}\[\]\\()|]/g, "\\$&")})`, "gi"),
  );
  return (
    <>
      {parts.map((part, index) =>
        part.toLowerCase() === query.toLowerCase() ? (
          <mark
            key={index}
            className="bg-yellow-200 text-black px-0 py-0 rounded"
          >
            {part}
          </mark>
        ) : (
          part
        ),
      )}
    </>
  );
};

// Универсальная функция для абсолютного URL
const getAbsoluteImageUrl = (imagePath?: string) => {
  if (!imagePath) return null;
  if (imagePath.startsWith("http")) return imagePath;
  const djangoMediaUrl =
    process.env.NEXT_PUBLIC_DJANGO_MEDIA_URL || "http://localhost:8000/media/";
  let cleanPath = imagePath;
  if (cleanPath.startsWith("/media/")) {
    cleanPath = cleanPath.substring("/media/".length);
  }
  const base = djangoMediaUrl.endsWith("/")
    ? djangoMediaUrl
    : `${djangoMediaUrl}/`;
  return `${base}${cleanPath}`;
};

const BlogPostPreview: React.FC<BlogPostPreviewProps> = ({
  post,
  searchQuery,
}) => {
  const finalImageUrl = getAbsoluteImageUrl(
    typeof post.image === "string" ? post.image : undefined,
  );
  // --- ОТЛАДКА ---
  console.log("[BlogPostPreview DEBUG] post.image received:", post?.image);
  // --- КОНЕЦ ОТЛАДКИ ---

  // Формат даты: 2 мая 2025 года
  const date = post.first_published_at
    ? format(new Date(post.first_published_at), "d MMMM yyyy 'года'", {
        locale: ru,
      })
    : "";
  // Анонс
  let rawExcerpt = post.description || "";
  if (rawExcerpt.length > 180) {
    rawExcerpt = rawExcerpt.slice(0, 180) + "...";
  }

  const titleContent = searchQuery
    ? highlightText(post.title, searchQuery)
    : post.title;
  const excerptContent = searchQuery
    ? highlightText(rawExcerpt, searchQuery)
    : rawExcerpt;

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
        {post.tags_details && post.tags_details.length > 0 ? (
          post.tags_details.map((tag_detail) => (
            <React.Fragment key={tag_detail.id}>
              <Link
                href={`/tags/${tag_detail.slug}`}
                className={`${styles.tagLink} ${styles.hoverCloneEffect} inline-block no-underline text-gray-500 hover:text-accentDark transition-colors duration-200`}
              >
                #{tag_detail.name}
              </Link>
            </React.Fragment>
          ))
        ) : (
          <span className="text-gray-500">блоге</span>
        )}
        <Link
          href={`/archive/${post.first_published_at ? new Date(post.first_published_at).getFullYear() : ""}/${post.first_published_at ? String(new Date(post.first_published_at).getMonth() + 1).padStart(2, "0") : ""}/${post.first_published_at ? String(new Date(post.first_published_at).getDate()).padStart(2, "0") : ""}`}
          className={`${styles.dateLink} ${styles.hoverCloneEffect} inline-block no-underline text-gray-400 hover:text-accentDark transition-colors duration-200`}
        >
          {date}
        </Link>
        {typeof post.average_rating === "number" && (
          <PostRating value={post.average_rating} />
        )}
      </div>
      {finalImageUrl && (
        <Link
          href={`/posts/${post.slug}`}
          className="block w-full max-w-[800px] mx-auto mb-4 group"
          aria-label={`Читать статью: ${post.title}`}
        >
          <Image
            src={finalImageUrl}
            alt={post.title}
            width={800}
            height={266}
            className="w-full h-auto object-cover rounded shadow group-hover:opacity-90 transition-opacity duration-200"
            priority={false}
            loading="lazy"
            unoptimized={true}
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
