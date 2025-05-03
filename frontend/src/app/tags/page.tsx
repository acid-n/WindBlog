import React from "react";
import { fetchTags } from "@/services/api";
import type { Tag } from "@/types/blog";

/**
 * Страница тегов — список всех тегов с количеством постов.
 */
const TagsPage = async () => {
  let tags: Tag[] = [];
  let error = "";
  try {
    tags = await fetchTags();
  } catch (e: any) {
    error = e?.message || "Ошибка загрузки тегов";
  }
  return (
    <section className="flex flex-col items-center gap-8 py-16 w-full">
      <h1 className="text-3xl font-bold text-gray-900">Теги</h1>
      {error && <div className="text-red-600 text-center">{error}</div>}
      <div className="w-full max-w-2xl flex flex-wrap gap-4 justify-center">
        {tags.length === 0 && !error && (
          <div className="text-gray-500 text-center">Теги отсутствуют.</div>
        )}
        {tags.map((tag) => (
          <a
            key={tag.id}
            href={`/tags/${tag.slug}`}
            className="bg-blue-100 text-blue-800 px-4 py-2 rounded text-base hover:bg-blue-200 transition-colors"
          >
            {tag.name} <span className="text-gray-500">({tag.posts_count ?? 0})</span>
          </a>
        ))}
      </div>
    </section>
  );
};

export default TagsPage;
