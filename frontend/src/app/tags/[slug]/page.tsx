'use client';
import React from "react";
import useSWR from 'swr';
import { notFound } from "next/navigation";
import { fetcher, fetchPostsByTag, fetchTags, PaginatedTagsResponse } from "@/services/api";
import type { Post, Tag } from "@/types/blog";
import BlogPostPreview from "@/components/blog-post-preview";
import Pagination from "@/components/pagination";

export const dynamic = 'force-dynamic';

const POSTS_PER_PAGE = 10;

interface TagPageProps {
  params: { slug: string };
  searchParams?: { page?: string | string[] }; // Обновил тип page
}

// Вспомогательные async функции
async function getResolvedParams(paramsInput: TagPageProps['params']) {
  return Promise.resolve(paramsInput);
}
async function getResolvedSearchParams(searchParamsInput: TagPageProps['searchParams']) {
  return Promise.resolve(searchParamsInput || {});
}

/**
 * Страница постов по тегу с пагинацией (SSR + client SWR).
 */
const TagPage = async ({ params: initialParams, searchParams: initialSearchParams }: TagPageProps) => {
  const params = await getResolvedParams(initialParams);
  const searchParams = await getResolvedSearchParams(initialSearchParams);
  const pageQuery = searchParams.page;
  const currentPage = Number(Array.isArray(pageQuery) ? pageQuery[0] : pageQuery) > 0 
    ? Number(Array.isArray(pageQuery) ? pageQuery[0] : pageQuery) 
    : 1;
  let tag: Tag | null = null;
  let error = "";
  let allPostsForTag: Post[] = [];
  try {
    allPostsForTag = await fetchPostsByTag(params.slug);
    const tagsResponse: PaginatedTagsResponse = await fetchTags(1);
    const tagsArray = tagsResponse?.results ?? [];
    tag = tagsArray.find((t) => t.slug === params.slug) || null;
    if (!tag && allPostsForTag.length === 0) {
      const isTagKnown = tagsArray.some(t => t.slug === params.slug);
      if (!isTagKnown) notFound();
    }
  } catch (e: unknown) {
    const errorMessage = e instanceof Error ? e.message : "An unknown error occurred while fetching posts for tag";
    error = errorMessage;
  }
  const totalPosts = allPostsForTag.length;
  const totalPages = Math.ceil(totalPosts / POSTS_PER_PAGE);
  if (!tag && totalPosts > 0) {
    tag = { id: 0, name: params.slug, slug: params.slug, posts_count: totalPosts }; 
  }
  return (
    <TagPostsSWR
      slug={params.slug}
      tag={tag}
      initialPosts={allPostsForTag}
      currentPage={currentPage}
      totalPages={totalPages}
      error={error}
    />
  );
};

/**
 * Клиентский компонент для отображения постов по тегу с поддержкой live-обновления через SWR
 */
function TagPostsSWR({ slug, tag, initialPosts, currentPage, totalPages, error }: {
  slug: string;
  tag: Tag | null;
  initialPosts: Post[];
  currentPage: number;
  totalPages: number;
  error: string;
}) {
  const { data: posts = initialPosts, error: swrError, isLoading } = useSWR(['/api/tags', slug], fetcher<Post[]>, {
    fallbackData: initialPosts
  });
  const paginatedPosts = posts.slice((currentPage - 1) * POSTS_PER_PAGE, currentPage * POSTS_PER_PAGE);
  if (error || swrError) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold text-red-600">Ошибка загрузки тега</h1>
        <p className="text-gray-700">Не удалось получить информацию для тега &quot;{decodeURIComponent(slug)}&quot;.</p>
      </div>
    );
  }
  return (
    <section className="container mx-auto px-4 py-8 md:py-12">
      <h1 className="font-lora text-[#222] text-3xl md:text-4xl font-medium text-center mb-8">
        Все посты с тегом: <span className="text-blue-700">#{tag?.name || slug}</span>
      </h1>
      {isLoading && <div className="text-gray-400 text-center">Загрузка...</div>}
      <div className="w-full max-w-4xl mx-auto"> 
        {paginatedPosts.length === 0 && (
          <div className="text-gray-500 text-center py-10">
            Посты с тегом <span className="font-semibold">#{tag?.name || slug}</span> отсутствуют (страница {currentPage}).
          </div>
        )}
        <div className="grid grid-cols-1 gap-8 md:gap-12">
          {paginatedPosts.map((post: Post) => (
            <BlogPostPreview key={post.slug || post.id} post={post} />
          ))}
        </div>
      </div>
      {totalPages > 1 && (
        <Pagination 
          currentPage={currentPage} 
          totalPages={totalPages} 
          baseUrl={`/tags/${slug}`}
        />
      )}
    </section>
  );
}

export default TagPage;