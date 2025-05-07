import React from "react";
import { fetchTags, PaginatedTagsResponse } from "@/services/api";
import type { Tag } from "@/types/blog";
import Pagination from "@/components/pagination";
import { Metadata, OpenGraph } from "next";

export const dynamic = 'force-dynamic';

interface TagsPageProps {
  searchParams?: { page?: string | string[] };
}

// Вспомогательная async функция
// async function getResolvedSearchParams(searchParamsInput: TagsPageProps['searchParams']) {
//   return Promise.resolve(searchParamsInput || {});
// }

/**
 * Страница Теги — MUSSON UX/UI STYLE GUIDE (список всех тегов с пагинацией).
 */
const TagsPage = async ({ searchParams: searchParamsProp = {} }: TagsPageProps) => {
  // console.log('[TagsPage] searchParamsProp BEFORE await - type:', typeof searchParamsProp, 'isPromise:', searchParamsProp instanceof Promise);
  const searchParams = await searchParamsProp;
  // console.log('[TagsPage] searchParams AFTER await - type:', typeof searchParams, 'isPromise:', searchParams instanceof Promise, 'value:', JSON.stringify(searchParams));
  
  // Используем "разрешенный" searchParams
  const pageQuery = searchParams.page; // Доступ без ?.
  const page = Number(Array.isArray(pageQuery) ? pageQuery[0] : pageQuery) > 0 
    ? Number(Array.isArray(pageQuery) ? pageQuery[0] : pageQuery) 
    : 1;

  let tagsResponse: PaginatedTagsResponse | null = null;
  let error = "";

  try {
    tagsResponse = await fetchTags(page);
  } catch (e: unknown) {
    const errorMessage = e instanceof Error ? e.message : "An unknown error occurred while fetching tags";
    console.error("Error fetching tags:", errorMessage);
    error = errorMessage;
  }

  const tags = tagsResponse?.results ?? [];
  const totalTagsCount = tagsResponse?.count ?? 0;
  const pageSize = 10;
  const totalPages = Math.ceil(totalTagsCount / pageSize);

  return (
    <section className="container mx-auto px-4 py-8 md:py-12">
      <h1
        className="font-lora text-[#222] text-3xl md:text-4xl font-medium text-center mb-8"
        style={{ fontFamily: "'Lora', serif" }}
      >
        Теги
      </h1>
      {error && <div className="text-red-600 text-center mb-4">{error}</div>}
      <div className="w-full max-w-3xl mx-auto">
        {tags.length === 0 && !error && (
          <div className="text-gray-500 text-center py-10">Теги отсутствуют.</div>
        )}
        <ul className="flex flex-wrap justify-center gap-x-4 gap-y-2">
          {tags.map((tag) => (
            <li key={tag.id}>
              <a
                href={`/tags/${tag.slug}`}
                className="inline-block px-3 py-1.5 text-lg font-medium text-gray-600 underline decoration-dotted decoration-gray-400 hover:text-gray-900 hover:bg-gray-100 hover:no-underline rounded transition-colors duration-150 ease-in-out"
              >
                {tag.name} <span className="ml-1 text-gray-900">({tag.posts_count})</span>
              </a>
            </li>
          ))}
        </ul>
      </div>
      {totalPages > 1 && (
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          basePath="/tags" // Убедитесь, что Pagination использует basePath или baseUrl
        />
      )}
    </section>
  );
};

export default TagsPage;

export async function generateMetadata(): Promise<Metadata> {
  // Метаданные для страницы тегов
  // ... (код для получения title, description, openGraph)
  try {
    // Здесь может быть логика, если метаданные зависят от каких-то асинхронных данных
    // В данном случае, они в основном статичны или берутся из констант
    const title = "Все теги | Блог Имя Фамилия";
    const description = "Обзор всех тегов, используемых в блоге Имя Фамилия. Найдите посты по интересующим вас темам.";
    const openGraph: OpenGraph = {
      title: title,
      description: description,
      type: 'website',
      url: `${process.env.NEXT_PUBLIC_BASE_URL}/tags`,
      // images: [ ... ] // Добавьте изображение, если нужно
    };

    return { title, description, openGraph };

  } catch (e: unknown) {
    const errorMessage = e instanceof Error ? e.message : "An unknown error occurred while fetching metadata for tags page";
    console.error("Error in generateMetadata for Tags page:", errorMessage);
    return {
      title: "Error Loading Tags Metadata",
      description: "Could not load metadata for the tags page.",
    };
  }
}
