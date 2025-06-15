import React from "react";
import type { Post, Tag } from "@/types/blog";
import Image from "next/image";
import { fetchPost } from "@/services/api";

import PostRating from "@/components/post-rating";
import { notFound } from "next/navigation";
import PostBody from "@/components/post-body";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import styles from "@/components/blog-post-preview/styles.module.css";
import ShareButton from "@/components/share-button";
import EditPostLink from "@/components/edit-post-link";

// Вспомогательная async функция для "получения" params
// async function getResolvedParams(paramsInput: { slug: string }) {
//   return Promise.resolve(paramsInput);
// }

// Вспомогательная функция для абсолютного URL
const getAbsoluteImageUrl = (imagePath?: string) => {
  if (!imagePath) return null;
  if (imagePath.startsWith("http")) return imagePath;
  const djangoMediaUrl =
    process.env.NEXT_PUBLIC_DJANGO_MEDIA_URL || "http://localhost:8000/media/";
  let cleanPath = imagePath;
  if (cleanPath.startsWith("/media/")) {
    cleanPath = cleanPath.substring("/media/".length);
  }
  const base = djangoMediaUrl.endsWith("/")
    ? djangoMediaUrl
    : `${djangoMediaUrl}/`;
  return `${base}${cleanPath}`;
};

// Метаданные страницы поста
export async function generateMetadata({
  params: paramsProp,
}: {
  params: { slug: string };
}) {
  const params = await paramsProp;
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
  const error = "";
  try {
    post = await fetchPost(params.slug);
  } catch (e: unknown) {
    const errorMessage =
      e instanceof Error
        ? e.message
        : "An unknown error occurred while fetching post";
    console.error("Error fetching post by slug:", errorMessage);
    // notFound(); // Вызываем notFound(), если пост не найден или произошла ошибка
    // Вместо прямого вызова notFound(), который может работать не так в RSC,
    // лучше вернуть специальный флаг или структуру, которую обработает родительский компонент или Next.js
    // Однако, если это основная функция загрузки данных для страницы, notFound() - подходящий вариант.
    // Учитывая, что это RSC, и мы хотим показать страницу 404, notFound() здесь уместен.
    notFound();
  }
  if (!post || error) return notFound();

  // ОТЛАДКА: логируем тело поста

  // Формат даты: 2 мая 2025 года
  const date = post.first_published_at
    ? format(new Date(post.first_published_at), "d MMMM yyyy 'года'", {
        locale: ru,
      })
    : "";

  // Формируем URL для шаринга
  const postUrl = `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/posts/${params.slug}`;

  // Используем full_url из shortlink если доступен, иначе формируем самостоятельно
  const shortUrl = post.shortlink
    ? post.shortlink.full_url ||
      `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}${post.shortlink.url}`
    : postUrl;

  return (
    <section className="flex flex-col items-center pt-[15px] w-full">
      <article className="flex flex-col items-center max-w-4xl w-full mx-auto">
        {post.image && (
          <div className="w-full max-w-[800px] px-4 md:px-0">
            <Image
              src={getAbsoluteImageUrl(post.image) || ""}
              alt={post.title}
              width={800}
              height={400}
              className="w-full h-auto object-cover rounded mb-6"
              loading="lazy"
            />
          </div>
        )}

        <div className="w-full max-w-[800px] px-4 md:px-0">
          <h1
            className="font-lora text-[#222] text-3xl md:text-4xl font-bold text-center mb-3 leading-tight"
            style={{ fontFamily: "'Lora', serif" }}
          >
            {post.title}
          </h1>

          <div
            className="flex flex-wrap items-center justify-center gap-x-2 text-lg text-[#b3b3b3] text-center mb-8"
            style={{ lineHeight: 1.5 }}
          >
            <span>пост в</span>
            {post.tags_details && post.tags_details.length > 0 ? (
              post.tags_details.map((tag: Tag) => (
                <React.Fragment key={tag.id}>
                  <a
                    href={`/tags/${tag.slug}`}
                    className={`${styles.hoverCloneEffect} inline-block no-underline text-[#888] hover:text-accentDark transition-colors duration-200`}
                    style={{ display: "inline", padding: "0 0.2em" }}
                  >
                    #{tag.name}
                  </a>
                </React.Fragment>
              ))
            ) : (
              <span>блоге</span>
            )}
            <a
              href={`/archive/${post.first_published_at ? new Date(post.first_published_at).getFullYear() : ""}/${post.first_published_at ? String(new Date(post.first_published_at).getMonth() + 1).padStart(2, "0") : ""}/${post.first_published_at ? String(new Date(post.first_published_at).getDate()).padStart(2, "0") : ""}`}
              className={`${styles.hoverCloneEffect} inline-block no-underline text-[#b3b3b3] hover:text-accentDark transition-colors duration-200`}
              style={{ display: "inline", padding: "0 0.2em" }}
            >
              {date}
            </a>
            <EditPostLink slug={post.slug} />
            {typeof post.average_rating === "number" && (
              <PostRating value={post.average_rating} />
            )}
            <ShareButton
              title={post.title}
              url={postUrl}
              shortUrl={shortUrl}
              className="ml-2"
            />
          </div>

          <div
            className="prose prose-lg w-full text-[#444]"
            style={{
              fontFamily: "'Lora', serif",
              lineHeight: 1.8,
              letterSpacing: "0.02em",
            }}
          >
            <PostBody content={post.body as any} />
          </div>
        </div>
      </article>
    </section>
  );
};

export default PostPage;
