"use client";
import React from "react";
import type { Post } from "@/types/blog";
import { motion } from "framer-motion";
import PostRating from "@/components/post-rating";
import { format } from "date-fns";
import Image from "next/image";

/**
 * Карточка поста для главной страницы (MUSSON STYLE GUIDE).
 */
interface PostCardProps {
  post: Post;
}

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

const PostCard: React.FC<PostCardProps> = ({ post }) => {
  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="bg-white rounded-[12px] border border-gray-200 p-[24px] w-full flex flex-col gap-3 font-lora text-[#444]"
      style={{ fontFamily: "Lora, serif", lineHeight: 1.6 }}
    >
      {post.image && (
        <a
          href={`/posts/${post.slug}`}
          className="block relative w-full h-48 mb-2"
          aria-label={`Открыть пост: ${post.title}`}
        >
          <Image
            src={getAbsoluteImageUrl(post.image)}
            alt={post.title}
            fill
            className="object-cover rounded"
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
            loading="lazy"
          />
        </a>
      )}
      <h2
        className="font-coustard text-[20px] font-bold text-[#CE6607] mb-1 leading-tight"
        style={{ letterSpacing: "0", lineHeight: 1.1 }}
      >
        <a
          href={`/posts/${post.slug}`}
          aria-label={`Читать пост: ${post.title}`}
          className="underline text-[#CE6607] hover:text-[#A35208] transition-colors"
        >
          {post.title}
        </a>
      </h2>
      {post.short_description || post.description ? (
        <p
          className="text-[15px] text-[#444] mb-1 font-lora leading-relaxed"
          style={{ lineHeight: 1.6 }}
        >
          {post.short_description || post.description}
        </p>
      ) : null}
      <div className="flex flex-wrap items-center gap-2 mb-1 text-sm text-[#CE6607]">
        {post.tags.length > 0 && (
          <span className="post-meta tags">
            {post.tags.map((tag, idx) => (
              <React.Fragment key={tag.id}>
                <a
                  href={`/tags/${tag.slug}`}
                  className="text-gray-600 hover:text-gray-900 hover:underline decoration-dotted transition-colors duration-150 ease-in-out"
                  aria-label={`Посты с тегом ${tag.name}`}
                >
                  {tag.name}
                </a>
                {idx < post.tags.length - 1 && <span className="mx-1">•</span>}
              </React.Fragment>
            ))}
          </span>
        )}
      </div>
      <div className="flex items-center justify-between text-xs text-gray-400">
        <span>
          {post.created_at
            ? format(new Date(post.created_at), "dd.MM.yyyy")
            : ""}
        </span>
        {typeof post.average_rating === "number" && (
          <PostRating value={post.average_rating} />
        )}
      </div>
      <div className="mt-2">
        <a
          href={`/posts/${post.slug}`}
          className="inline-flex items-center gap-2 px-5 py-1.5 bg-[#CE6607] text-white rounded font-coustard text-[15px] hover:bg-[#A35208] transition-colors"
          aria-label={`Читать пост: ${post.title}`}
        >
          <i className="fa fa-book-open mr-2" aria-hidden="true"></i>
          Читать
        </a>
      </div>
    </motion.article>
  );
};

export default PostCard;
