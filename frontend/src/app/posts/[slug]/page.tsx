import React from "react";
import { fetchPost } from "@/services/api";
import type { Post } from "@/types/blog";
import PostRating from "@/components/post-rating";
import { notFound } from "next/navigation";
import PostBody from "@/components/post-body";
import { format } from "date-fns";

/**
 * Страница поста — отображение полной статьи по slug.
 */
const PostPage = async ({ params }: any) => {
  let post: Post | null = null;
  let error = "";
  try {
    post = await fetchPost(params.slug);
  } catch (e: any) {
    error = e?.message || "Ошибка загрузки поста";
  }
  if (!post || error) return notFound();

  return (
    <section className="flex flex-col items-center gap-8 py-16 w-full">
      <article className="w-full max-w-2xl bg-white rounded-lg shadow p-8">
        {post.image && (
          <img
            src={post.image}
            alt={post.title}
            className="w-full h-72 object-cover rounded mb-6"
            loading="lazy"
          />
        )}
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{post.title}</h1>
        <div className="flex flex-wrap gap-2 mb-4">
          {post.tags.map((tag) => (
            <a
              key={tag.id}
              href={`/tags/${tag.slug}`}
              className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs hover:bg-blue-200 transition-colors"
            >
              {tag.name}
            </a>
          ))}
        </div>
        <div className="flex items-center gap-4 text-xs text-gray-400 mb-6">
          <span>{new Date(post.created_at).toLocaleDateString()}</span>
          {typeof post.average_rating === "number" && <PostRating value={post.average_rating} />}
        </div>
        <div className="prose prose-lg max-w-none text-gray-800">
          <PostBody body={post.body} />
        </div>
      </article>
    </section>
  );
};

export default PostPage;
