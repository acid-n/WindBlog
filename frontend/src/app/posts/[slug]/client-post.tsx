'use client';

import React, { useState, useEffect } from "react";
import { fetchPost } from "@/services/api";
import type { Post, Tag } from "@/types/blog";
import ClientImage from "@/components/client-image";
import PostRating from "@/components/post-rating";
import PostBody from "@/components/post-body";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import styles from "@/components/blog-post-preview/styles.module.css";
import ShareButton from "@/components/share-button";
import EditPostLink from "@/components/edit-post-link";

/**
 * Клиентский компонент для отображения поста
 * Вместо SWR используем useState/useEffect для устранения проблем совместимости
 */
export default function ClientPost({ slug, initialPost }: { slug: string, initialPost: Post }) {
  const [post, setPost] = useState<Post>(initialPost);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  // Дебаг-сообщение для отслеживания работы компонента
  console.log(`Загрузка поста с slug: ${slug}, начальные данные:`, 
    initialPost ? {идентификатор: initialPost.id, заголовок: initialPost.title} : 'Нет данных');
  
  // Имитация работы SWR с использованием useEffect
  useEffect(() => {
    // При изменении slug - загружаем новые данные
    const loadPost = async () => {
      try {
        setIsLoading(true);
        console.log(`Начало загрузки поста с slug: ${slug}`);
        
        // Используем правильный путь API с сегментом v1
        console.log(`Отправляем запрос на /api/v1/posts/${slug}/`);
        const response = await fetch(`/api/v1/posts/${slug}/`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
          cache: 'no-store'
        });
        
        if (!response.ok) {
          throw new Error(`Ошибка загрузки поста: ${response.status} ${response.statusText}`);
        }
        
        const freshPost = await response.json();
        console.log(`Успешная загрузка поста:`, 
          freshPost ? {идентификатор: freshPost.id, заголовок: freshPost.title} : 'Нет данных');
        
        if (freshPost) {
          setPost(freshPost);
        }
        setIsLoading(false);
      } catch (e) {
        console.error(`Ошибка при загрузке поста ${slug}:`, e);
        setError(e instanceof Error ? e : new Error('Failed to load post'));
        setIsLoading(false);
      }
    };
    
    // Загружаем данные только если не текущая загрузка
    if (!isLoading) {
      loadPost();
    }
  }, [slug]);

  if (error) return <div className="text-red-600 text-center">Ошибка загрузки поста</div>;
  if (!post) return <div className="text-gray-400 text-center">Загрузка...</div>;

  const date = post.first_published_at
    ? format(new Date(post.first_published_at), "d MMMM yyyy 'года'", {
        locale: ru,
      })
    : "";
  const postUrl = `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/posts/${slug}`;
  const shortUrl = post.shortlink
    ? post.shortlink.full_url ||
      `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}${post.shortlink.url}`
    : postUrl;

  return (
    <section className="flex flex-col items-center pt-[15px] w-full">
      <article className="flex flex-col items-center max-w-4xl w-full mx-auto">
        {post.image && (
          <div className="w-full max-w-[800px] px-4 md:px-0">
            <ClientImage
              src={post.image}
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
}
