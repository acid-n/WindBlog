import React from "react";
import { fetchPostsByTag, fetchTags } from "@/services/api";
import type { Post, Tag } from "@/types/blog";
import PostCard from "@/components/post-card";

const POSTS_PER_PAGE = 10;

/**
 * Страница постов по тегу с пагинацией.
 */
const TagPage = async ({ params }: any) => {
  const page = Number(params?.page) > 0 ? Number(params?.page) : 1;
  let posts: Post[] = [];
  let tag: Tag | null = null;
  let error = "";
  try {
    posts = await fetchPostsByTag(params.slug);
    // Получаем имя тега для заголовка
    const tags = await fetchTags();
    tag = tags.find((t) => t.slug === params.slug) || null;
  } catch (e: any) {
    error = e?.message || "Ошибка загрузки постов по тегу";
  }
  const total = posts.length;
  const paginated = posts.slice((page - 1) * POSTS_PER_PAGE, page * POSTS_PER_PAGE);
  const totalPages = Math.ceil(total / POSTS_PER_PAGE);

  return (
    <section className="flex flex-col items-center gap-8 py-16 w-full">
      <h1 className="text-3xl font-bold text-gray-900">
        Все посты с тегом: <span className="text-blue-700">#{tag?.name || params.slug}</span>
      </h1>
      {error && <div className="text-red-600 text-center">{error}</div>}
      <div className="w-full max-w-2xl flex flex-col gap-6">
        {paginated.length === 0 && !error && (
          <div className="text-gray-500 text-center">Посты с этим тегом отсутствуют.</div>
        )}
        {paginated.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>
      {totalPages > 1 && (
        <div className="flex gap-2 mt-8">
          <a
            href={`/tags/${params.slug}?page=${page - 1}`}
            className={`px-4 py-2 rounded border ${page === 1 ? "text-gray-400 border-gray-200 cursor-not-allowed" : "text-blue-600 border-blue-200 hover:bg-blue-50"}`}
            aria-disabled={page === 1}
            tabIndex={page === 1 ? -1 : 0}
          >
            Назад
          </a>
          <span className="px-4 py-2 text-gray-700">{page} / {totalPages}</span>
          <a
            href={`/tags/${params.slug}?page=${page + 1}`}
            className={`px-4 py-2 rounded border ${page === totalPages ? "text-gray-400 border-gray-200 cursor-not-allowed" : "text-blue-600 border-blue-200 hover:bg-blue-50"}`}
            aria-disabled={page === totalPages}
            tabIndex={page === totalPages ? -1 : 0}
          >
            Вперёд
          </a>
        </div>
      )}
    </section>
  );
};

export default TagPage;
