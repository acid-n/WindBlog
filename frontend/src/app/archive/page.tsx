import React from "react";
import { fetchPosts } from "@/services/api";
import type { Post } from "@/types/blog";

/**
 * Группирует посты по годам и месяцам публикации.
 */
function groupPostsByYearMonth(posts: Post[]) {
  const groups: Record<string, Record<string, Post[]>> = {};
  posts.forEach((post) => {
    const date = new Date(post.first_published_at);
    const year = date.getFullYear().toString();
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    if (!groups[year]) groups[year] = {};
    if (!groups[year][month]) groups[year][month] = [];
    groups[year][month].push(post);
  });
  return groups;
}

/**
 * Страница архива — навигация по годам, месяцам, датам публикации постов.
 */
const ArchivePage = async () => {
  let posts: Post[] = [];
  let error = "";
  try {
    posts = await fetchPosts();
  } catch (e: any) {
    error = e?.message || "Ошибка загрузки постов";
  }
  const groups = groupPostsByYearMonth(posts);
  const years = Object.keys(groups).sort((a, b) => Number(b) - Number(a));

  return (
    <section className="flex flex-col items-center gap-8 py-16 w-full">
      <h1 className="text-3xl font-bold text-gray-900">Архив</h1>
      {error && <div className="text-red-600 text-center">{error}</div>}
      <div className="w-full max-w-3xl">
        {years.length === 0 && !error && (
          <div className="text-gray-500 text-center">Посты отсутствуют.</div>
        )}
        {years.map((year) => (
          <div key={year} className="mb-8">
            <h2 className="text-2xl font-semibold text-blue-800 mb-4">{year}</h2>
            {Object.keys(groups[year])
              .sort((a, b) => Number(b) - Number(a))
              .map((month) => (
                <div key={month} className="mb-4 ml-4">
                  <h3 className="text-lg font-medium text-blue-600 mb-2">
                    {new Date(Number(year), Number(month) - 1).toLocaleString("ru-RU", { month: "long" })}
                  </h3>
                  <ul className="space-y-2">
                    {groups[year][month].map((post) => (
                      <li key={post.id}>
                        <a
                          href={`/posts/${post.slug}`}
                          className="text-base text-gray-900 hover:text-blue-700 underline"
                        >
                          {post.title}
                        </a>
                        <span className="ml-2 text-gray-400 text-sm">
                          {new Date(post.first_published_at).toLocaleDateString("ru-RU")}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
          </div>
        ))}
      </div>
    </section>
  );
};

export default ArchivePage;
