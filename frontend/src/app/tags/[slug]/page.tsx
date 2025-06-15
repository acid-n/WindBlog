import React from "react";
import { notFound } from "next/navigation";
import { fetchPostsByTag, fetchTags, PaginatedTagsResponse } from "@/services/api";
import type { Post, Tag } from "@/types/blog";
import BlogPostPreview from "@/components/blog-post-preview"; // Добавляем BlogPostPreview
import Pagination from "@/components/pagination"; // Добавляем Pagination

// Явно указываем динамический рендеринг
export const dynamic = 'force-dynamic';

const POSTS_PER_PAGE = 10; // Это значение должно быть согласовано с API, если API делает свою пагинацию

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
 * Страница постов по тегу с пагинацией.
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
  let allPostsForTag: Post[] = []; // Будем хранить все посты для тега для ручной пагинации

  try {
    // fetchPostsByTag, судя по всему, возвращает ВСЕ посты для тега, а не пагинированный список.
    // Если это так, пагинацию нужно делать на клиенте (в данном Server Component).
    allPostsForTag = await fetchPostsByTag(params.slug);
    
    const tagsResponse: PaginatedTagsResponse = await fetchTags(1); // Предполагаем, что fetchTags возвращает все теги или достаточное их количество для поиска текущего
    const tagsArray = tagsResponse?.results ?? [];
    tag = tagsArray.find((t) => t.slug === params.slug) || null;

    if (!tag && allPostsForTag.length === 0) { // Если тег не найден и постов нет, вероятно, 404
        // Проверяем, был ли запрос к fetchPostsByTag успешным, но вернул пустой массив
        // или сам fetchPostsByTag выбросил 404 (что должно было обработаться notFound() внутри него, если бы он так делал)
        // В данном случае, если тег не найден в общем списке тегов и постов по этому слагу нет, считаем 404.
        const isTagKnown = tagsArray.some(t => t.slug === params.slug);
        if (!isTagKnown) notFound();
    }

  } catch (e: unknown) {
    const errorMessage = e instanceof Error ? e.message : "An unknown error occurred while fetching posts for tag";
    console.error(`Error fetching posts for tag ${params.slug}:`, errorMessage);
    error = errorMessage; // Сохраняем сообщение об ошибке для отображения
    // Вместо notFound() можно отобразить сообщение об ошибке на странице
    // notFound(); 
  }
  
  const totalPosts = allPostsForTag.length;
  const paginatedPosts = allPostsForTag.slice((currentPage - 1) * POSTS_PER_PAGE, currentPage * POSTS_PER_PAGE);
  const totalPages = Math.ceil(totalPosts / POSTS_PER_PAGE);

  if (!tag && totalPosts > 0) {
    // Если тег не нашелся в общем списке, но посты есть, используем slug как имя тега
    // Это может произойти, если список тегов неполный или есть какая-то рассинхронизация
    tag = { id: 0, name: params.slug, slug: params.slug, posts_count: totalPosts }; 
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold text-red-600">Ошибка загрузки тега</h1>
        <p className="text-gray-700">Не удалось получить информацию для тега &quot;{decodeURIComponent(params.slug)}&quot;.</p>
        {/* <p className="text-sm text-gray-500">Детали: {error}</p> */}
      </div>
    );
  }

  return (
    <section className="container mx-auto px-4 py-8 md:py-12">
      <h1 className="font-lora text-[#222] text-3xl md:text-4xl font-medium text-center mb-8">
        Все посты с тегом: <span className="text-blue-700">#{tag?.name || params.slug}</span>
      </h1>
      {error && <div className="text-red-600 text-center mb-4">{error}</div>}
      
      <div className="w-full max-w-4xl mx-auto"> 
        {paginatedPosts.length === 0 && !error && (
          <div className="text-gray-500 text-center py-10">
            Посты с тегом <span className="font-semibold">#{tag?.name || params.slug}</span> отсутствуют (страница {currentPage}).
          </div>
        )}
        <div className="grid grid-cols-1 gap-8 md:gap-12">
          {paginatedPosts.map((post) => (
            <BlogPostPreview key={post.slug || post.id} post={post} />
          ))}
        </div>
      </div>
      {totalPages > 1 && (
        <Pagination 
          currentPage={currentPage} 
          totalPages={totalPages} 
          baseUrl={`/tags/${params.slug}`}
        />
      )}
    </section>
  );
};

export default TagPage;