import React from "react";
import type { Post } from "@/types/blog";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import styles from "./styles.module.css";

/**
 * Превью поста для главной страницы (стиль Read WP, RU).
 */
interface BlogPostPreviewProps {
  post: Post;
}

const BlogPostPreview: React.FC<BlogPostPreviewProps> = ({ post }) => {
  // Формат даты: 2 мая 2025 года
  const date = post.created_at
    ? format(new Date(post.created_at), "d MMMM yyyy 'года'", { locale: ru })
    : "";
  // Тег
  const tag = post.tags[0];
  // Анонс
  let excerpt = post.description || post.content || '';
  if (excerpt.length > 180) {
    excerpt = excerpt.slice(0, 180) + '...';
  }

  return (
    <article className="flex flex-col items-center max-w-4xl w-full mx-auto mb-20">
      <h2
        className="font-lora text-[#222] text-2xl md:text-3xl font-bold text-center mb-2 leading-tight"
        style={{ fontFamily: "'Lora', serif" }}
      >
        <a
          href={`/posts/${post.slug}`}
          className={`inline-block rounded focus:outline-none px-[0.2em] ${styles['bg-hover-clone']}`}
          style={{ textDecoration: "none", color: "#222", paddingBottom: "0.34em" }}
        >
          {post.title}
        </a>
      </h2>
      <div className="text-lg text-[#b3b3b3] text-center mb-2" style={{ lineHeight: 1.5 }}>
        пост в {tag ? (
          <a
            href={`/tags/${tag.slug}`}
            className={`${styles['bg-hover-clone']}`}
            style={{ display: 'inline', padding: '0 0.2em', textDecoration: 'none', color: '#888' }}
          >
            #{tag.name}
          </a>
        ) : (
          <span>блоге</span>
        )} 
        <a
          href={`/archive/${post.created_at ? new Date(post.created_at).getFullYear() : ''}/${post.created_at ? String(new Date(post.created_at).getMonth() + 1).padStart(2, '0') : ''}/${post.created_at ? String(new Date(post.created_at).getDate()).padStart(2, '0') : ''}`}
          className={`${styles['bg-hover-clone']}`}
          style={{ display: 'inline', padding: '0 0.2em', textDecoration: 'none', color: '#b3b3b3' }}
        >
          {date}
        </a>
      </div>
      {post.image && (
        <img
          src={typeof post.image === 'string' ? post.image : post.image?.url}
          alt={post.title}
          className="w-full max-w-[800px] mx-auto mb-4 rounded shadow"
          loading="lazy"
        />
      )}
      {excerpt && (
        <div className="text-center text-base text-[#444] mb-4 font-serif">
          {excerpt}
        </div>
      )}
      <a
        href={`/posts/${post.slug}`}
        className={`${styles['bg-hover-clone']} inline-block font-bold text-xl tracking-wide pb-1 mt-1`}
        style={{ textDecoration: 'none', display: 'inline', padding: '0 0.2em', color: '#222' }}
      >
        Читать <span className="ml-1">→</span>
      </a>
    </article>
  );
};

export default BlogPostPreview;