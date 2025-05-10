import React from "react";
import { notFound } from 'next/navigation';
import { fetchArchivePostsByDate } from "@/services/api";
import BlogPostPreview from "@/components/blog-post-preview";
import type { Post } from "@/types/blog";

interface ArchiveDayPageProps {
  params: { year: string; month: string; day: string };
}

function getMonthName(month: number): string {
  const date = new Date(2000, month - 1, 1);
  return date.toLocaleString("ru-RU", { month: "long" });
}

const ArchiveDayPage = async ({ params }: ArchiveDayPageProps) => {
  const { year: yearString, month: monthString, day: dayString } = params;
  const year = parseInt(yearString, 10);
  const month = parseInt(monthString, 10);
  const day = parseInt(dayString, 10);

  if (
    isNaN(year) ||
    isNaN(month) ||
    isNaN(day) ||
    month < 1 || month > 12 ||
    day < 1 || day > 31
  ) {
    notFound();
  }

  let posts: Post[] = [];
  let error = "";
  try {
    const response = await fetchArchivePostsByDate(year, month, day);
    posts = response.results;
  } catch (e: unknown) {
    error = e instanceof Error ? e.message : "Ошибка загрузки постов за день.";
  }

  return (
    <section className="flex flex-col items-center gap-8 py-16 w-full">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">
        Посты за {day} {getMonthName(month)} {year} года
      </h1>
      {error && (
        <div className="text-red-500 text-center">{error}</div>
      )}
      <div className="w-full max-w-xl mt-6">
        {posts.length === 0 && !error && (
          <div className="text-gray-500 py-6 text-center">Нет постов за этот день.</div>
        )}
        {posts.length > 0 && (
          <div>
            {posts.map((post) => (
              <BlogPostPreview key={post.id} post={post} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default ArchiveDayPage;
