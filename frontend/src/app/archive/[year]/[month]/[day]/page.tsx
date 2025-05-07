import React from "react";
import { notFound } from 'next/navigation';
import BlogPostPreview from "@/components/blog-post-preview";
import Pagination from "@/components/pagination";
import {
  fetchArchivePostsByDate,
  PaginatedPostsResponse
} from "@/services/api";
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

// Явно указываем динамический рендеринг
export const dynamic = 'force-dynamic';

interface ArchiveDayPageProps {
  params: Promise<{ year: string; month: string; day: string }>;
  searchParams?: { 
    page?: string | string[]; // Уточняем тип page
  };
}

// Убираем вспомогательные async функции для params, searchParams остаются как есть или обрабатываются аналогично, если потребуется
// async function getResolvedParams(paramsInput: ArchiveDayPageProps['params']) {
//   return Promise.resolve(paramsInput);
// }
async function getResolvedSearchParams(searchParamsInput: ArchiveDayPageProps['searchParams']) {
  return Promise.resolve(searchParamsInput || {});
}

/**
 * Страница архива для конкретного дня — отображение постов.
 */
const ArchiveDayPage = async ({ params: paramsPromise, searchParams: initialSearchParams }: ArchiveDayPageProps) => {
  // Напрямую ожидаем paramsPromise, так как это Promise согласно типу
  const params = await paramsPromise;
  const searchParams = await getResolvedSearchParams(initialSearchParams); // searchParams могут обрабатываться иначе

  const yearString = params.year;
  const monthString = params.month;
  const dayString = params.day;
  const year = parseInt(yearString, 10);
  const month = parseInt(monthString, 10);
  const day = parseInt(dayString, 10);

  if (isNaN(year) || isNaN(month) || month < 1 || month > 12 || isNaN(day) || day < 1 || day > 31) {
      notFound(); // Валидация параметров
  }

  let pageQuery: string | undefined = undefined;
  if (searchParams.page) {
    pageQuery = Array.isArray(searchParams.page) ? searchParams.page[0] : searchParams.page;
  }
  const page = Number(pageQuery) > 0 ? Number(pageQuery) : 1;

  let postsResponse: PaginatedPostsResponse = { count: 0, next: null, previous: null, results: [] };
  let error = "";

  try {
    // Используем реальную функцию API
    postsResponse = await fetchArchivePostsByDate(year, month, day, page);
  } catch (e: unknown) {
    const errorMessage = e instanceof Error ? e.message : "An unknown error occurred while fetching posts for archive day";
    console.error(`Error fetching posts for archive ${year}/${month}/${day}:`, errorMessage);
    error = errorMessage;
    if (errorMessage === "Invalid date format" || (e instanceof Error && e.message.includes("404"))) {
      notFound();
    }
  }

  // Проверяем, что postsResponse не null/undefined и содержит results
  // Инициализируем posts пустым массивом по умолчанию
  const posts = postsResponse?.results ?? [];
  const count = postsResponse?.count ?? 0;
  // const next = postsResponse?.next; // Пока не используем
  // const previous = postsResponse?.previous; // Пока не используем

  const totalPages = Math.ceil(count / 10); // Используем безопасное значение count
  const basePath = `/archive/${year}/${monthString}/${dayString}`;

  // Форматируем дату для заголовка и сообщения об отсутствии постов
  const pageDate = new Date(year, month - 1, day);
  const formattedPageTitleDate = format(pageDate, 'd MMMM yyyy \'года\'', { locale: ru });
  const formattedNoPostsDate = format(pageDate, 'd MMMM yyyy \'года\'', { locale: ru }); // Тоже самое, можно одну переменную

  // Логируем полученный ответ для отладки
  if (!postsResponse?.results) {
    console.warn('API response for posts did not contain a results array:', postsResponse);
  }

  return (
    <section className="container mx-auto px-4 py-8 md:py-12">
      {/* Заголовок страницы - День Месяц Год */}
      <h1
        className="font-lora text-[#222] text-3xl md:text-4xl font-medium text-center mb-8 capitalize"
        style={{ fontFamily: "'Lora', serif" }}
      >
        Архив: {formattedPageTitleDate}
      </h1>
      {error && <div className="text-red-600 text-center mb-4">{error}</div>}

      {posts.length === 0 && !error && (
        <div className="text-gray-500 text-center py-10">
          Постов за {formattedNoPostsDate.toLowerCase()} нет.
        </div>
      )}

      {/* Список постов */}
      {posts.length > 0 && (
        <div className="grid grid-cols-1 gap-8 md:gap-12">
          {posts.map((post) => (
            <BlogPostPreview key={post.slug} post={post} />
          ))}
        </div>
      )}

      {/* Пагинация */}      
      {totalPages > 1 && (
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            baseUrl={basePath} // Меняем basePath на baseUrl
          />
      )}
    </section>
  );
};

export default ArchiveDayPage; 