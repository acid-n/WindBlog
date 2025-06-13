import React from "react";
import { fetchPost } from "@/services/api";
import type { Post } from "@/types/blog";
import { notFound } from "next/navigation";
import ClientPost from "./client-post";

// В Next.js App Router все компоненты по умолчанию являются серверными (RSC)
// SWR должен использоваться только в клиентских компонентах ('use client')

// Вспомогательная async функция для "получения" params
// async function getResolvedParams(paramsInput: { slug: string }) {
//   return Promise.resolve(paramsInput);
// }


// Метаданные страницы поста
export async function generateMetadata({
  params: paramsProp,
}: {
  params: { slug: string };
}) {
  // console.log('[generateMetadata] paramsProp BEFORE await - type:', typeof paramsProp, 'isPromise:', paramsProp instanceof Promise);
  const params = await paramsProp;
  // console.log('[generateMetadata] params AFTER await - type:', typeof params, 'isPromise:', params instanceof Promise, 'value:', JSON.stringify(params));
  try {
    const post = await fetchPost(params.slug);
    if (!post) return { title: "Пост не найден" };

    return {
      title: `${post.title} — Блог`,
      description:
        post.description ||
        post.short_description ||
        `Пост "${post.title}" в блоге`,
      openGraph: {
        title: post.title,
        description:
          post.description ||
          post.short_description ||
          `Пост "${post.title}" в блоге`,
        images: post.image ? [{ url: post.image }] : [],
      },
    };
  } catch (e: unknown) {
    const errorMessage =
      e instanceof Error
        ? e.message
        : "An unknown error occurred while fetching metadata";
    console.error("Error in generateMetadata for Post:", errorMessage);
    return {
      title: "Error",
      description: "Could not load post metadata.",
    };
  }
}

/**
 * Страница поста — отображение полной статьи по slug.
 */
const PostPage = async ({
  params: paramsProp,
}: {
  params: { slug: string };
}) => {
  const params = await paramsProp;
  let post: Post | null = null;
  try {
    post = await fetchPost(params.slug);
  } catch (e: unknown) {
    notFound();
  }
  if (!post) return notFound();
  
  // Используем клиентский компонент для SWR вместо удаленного PostPageSWR
  return <ClientPost slug={params.slug} initialPost={post} />;
};



export default PostPage;

