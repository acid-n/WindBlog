import React from "react";
import { searchPosts } from "@/services/api";
import BlogPostPreview from "@/components/blog-post-preview";
import type { Post, PaginatedPostsResponse } from "@/types/blog";
import Pagination from "@/components/pagination";
import AnimatedSection from "@/components/animated-section";

export const dynamic = 'force-dynamic';

interface SearchPageProps {
  searchParams?: {
    q?: string | string[];
    page?: string | string[];
  };
}

/**
 * Страница поиска — MUSSON UX/UI STYLE GUIDE.
 */
const SearchPage = async ({ searchParams: searchParamsProp = {} }: SearchPageProps) => {
  const searchParams = await searchParamsProp;

  const rawQuery = searchParams.q;
  const searchQuery = Array.isArray(rawQuery) ? rawQuery[0] || "" : rawQuery || "";

  const rawPage = searchParams.page;
  const pageString = Array.isArray(rawPage) ? rawPage[0] : rawPage;
  const currentPage = parseInt(pageString || "1", 10);

  let postsResponse: PaginatedPostsResponse | null = null;
  let error: string | null = null;
  let totalPostsFound = 0;

  if (searchQuery) {
    try {
      postsResponse = await searchPosts(searchQuery, currentPage);
      totalPostsFound = postsResponse?.count || 0;
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : "An unknown error occurred while searching posts";
      console.error(`Error searching posts (query: ${searchQuery}, page: ${currentPage}):`, errorMessage);
      error = errorMessage;
    }
  }

  const posts = postsResponse?.results || [];
  const postsPerPage = 10;
  const totalPages = Math.ceil(totalPostsFound / postsPerPage);

  const pageTitle = searchQuery 
    ? `Результаты поиска по запросу "${searchQuery}"`
    : "Поиск по сайту";
  
  const foundCountMessage = searchQuery 
    ? ` (Найдено: ${totalPostsFound})`
    : "";

  return (
    <AnimatedSection
      className="flex flex-col items-center gap-8 pt-[40px] w-full bg-white"
      ariaLabel={pageTitle}
    >
      <div className="container w-full px-4 md:px-0">
        <h1 className="font-coustard text-3xl md:text-4xl font-bold mb-8 text-center">
          {pageTitle} <span className="text-gray-500 text-2xl md:text-3xl">{foundCountMessage}</span>
        </h1>

        {error && (
          <div className="text-center text-red-500 font-lora text-lg py-10">
            <p>Ошибка: {error}</p>
          </div>
        )}

        {!searchQuery && !error && (
          <p className="font-lora text-lg text-gray-500 text-center py-10">
            Введите поисковый запрос в строке поиска в шапке сайта.
          </p>
        )}

        {searchQuery && !error && posts.length === 0 && totalPostsFound === 0 && (
          <p className="font-lora text-lg text-gray-500 text-center py-10">
            По вашему запросу &quot;{searchQuery}&quot; ничего не найдено.
          </p>
        )}

        {posts.length > 0 && (
          <div>
            {posts.map((post: Post) => (
              <BlogPostPreview key={post.id} post={post} searchQuery={searchQuery} />
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            baseUrl={`/search?q=${encodeURIComponent(searchQuery)}`}
          />
        )}
      </div>
    </AnimatedSection>
  );
};

export default SearchPage; 