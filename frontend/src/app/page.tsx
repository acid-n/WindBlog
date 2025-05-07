import React from "react";
import { fetchPosts, PaginatedPostsResponse } from "@/services/api";
import type { Post } from "@/types/blog";
import BlogPostPreview from "@/components/blog-post-preview";
import AnimatedSection from "@/components/animated-section";
import Pagination from "@/components/pagination";
import type { Metadata } from 'next';

// Явно указываем динамический рендеринг (т.к. используем searchParams)
export const dynamic = 'force-dynamic';

// TODO: Получать эти данные из API (например, из SiteSettings) или констант
const SITE_TITLE = "MUSSON Blog";
const SITE_DESCRIPTION = "Блог о технологиях, разработке и жизни. Читайте свежие статьи, обзоры и советы от MUSSON.";

export async function generateMetadata(): Promise<Metadata> {
  // Здесь можно фетчить данные, если название/описание сайта динамические
  // const siteSettings = await fetchSiteSettings(); // Пример
  try {
    return {
      title: `${SITE_TITLE} - Главная страница`,
      description: SITE_DESCRIPTION,
      openGraph: {
        title: `${SITE_TITLE} - Главная страница`,
        description: SITE_DESCRIPTION,
        // images: [ { url: '/default-og-image.png' } ], // Добавьте URL к OG изображению
        // url: '/', // URL главной страницы
        siteName: SITE_TITLE,
        locale: 'ru_RU',
        type: 'website',
      },
      twitter: {
        card: 'summary_large_image',
        title: `${SITE_TITLE} - Главная страница`,
        description: SITE_DESCRIPTION,
        // images: ['/default-og-image.png'], // Добавьте URL к Twitter изображению
        // creator: '@yourtwitterhandle',
      },
      // Дополнительные мета-теги
      // icons: { icon: "/favicon.ico" }, // Если favicon не в корне public
      // robots: { index: true, follow: true }, // По умолчанию и так true
    };
  } catch (e: unknown) {
    const errorMessage = e instanceof Error ? e.message : "An unknown error occurred while fetching metadata for home page";
    console.error("Error in generateMetadata for Home Page:", errorMessage);
    return {
      title: "Error Loading Homepage Metadata",
      description: "Could not load metadata for the homepage.",
    };
  }
}

// TODO: Это значение должно быть синхронизировано с PAGE_SIZE в Django REST Framework настройках (сейчас по умолчанию 10).
// В идеале, API должен возвращать page_size в ответе пагинации, или это значение должно быть доступно
// через общую конфигурацию / переменные окружения, доступные и бэкенду, и фронтенду.
const DEFAULT_PAGE_SIZE = 10;

// Определяем тип для пропсов, чтобы указать searchParams
interface HomePageProps {
  searchParams?: { 
    page?: string | string[];
  };
}

// Вспомогательная async функция
// async function getResolvedSearchParams(searchParamsInput: HomePageProps['searchParams']) {
//   return Promise.resolve(searchParamsInput || {});
// }

const Home = async ({ searchParams: searchParamsProp = {} }: HomePageProps) => {
  // console.log('[Home] searchParamsProp BEFORE await - type:', typeof searchParamsProp, 'isPromise:', searchParamsProp instanceof Promise);
  const searchParams = await searchParamsProp;
  // console.log('[Home] searchParams AFTER await - type:', typeof searchParams, 'isPromise:', searchParams instanceof Promise, 'value:', JSON.stringify(searchParams));
  
  let pageQuery: string | undefined = undefined;
  // Используем "разрешенный" searchParams
  if (searchParams.page) { // Доступ без ?.
    pageQuery = Array.isArray(searchParams.page) ? searchParams.page[0] : searchParams.page;
  }
  const page = Number(pageQuery) > 0 ? Number(pageQuery) : 1;

  // Инициализируем переменную для хранения ответа API
  let postsResponse: PaginatedPostsResponse | null = null;
  let error = "";

  try {
    // Передаем номер страницы в fetchPosts
    postsResponse = await fetchPosts(page);
  } catch (e: unknown) {
    const errorMessage = e instanceof Error ? e.message : "An unknown error occurred while fetching posts for home page";
    console.error(`Error fetching posts for home page (page: ${page}):`, errorMessage);
    error = errorMessage; // Сохраняем сообщение об ошибке для отображения
  }

  // Безопасно извлекаем данные из ответа
  const posts = postsResponse?.results ?? [];
  const totalPostsCount = postsResponse?.count ?? 0;
  
  // Рассчитываем totalPages на основе count из API и PAGE_SIZE из Django
  const totalPages = Math.ceil(totalPostsCount / DEFAULT_PAGE_SIZE);

  // Клиентская пагинация больше не нужна:
  // const total = posts.length; // Неверно, это только длина текущей страницы
  // const paginated = posts.slice((page - 1) * POSTS_PER_PAGE, page * POSTS_PER_PAGE);
  // const totalPages = Math.ceil(total / POSTS_PER_PAGE);

  return (
    <AnimatedSection
      className="flex flex-col items-center gap-8 pt-[40px] w-full bg-white"
      ariaLabel="Последние статьи"
    >
      <div className="container w-full">
        {error && <div className="text-red-600 text-center mb-4">{error}</div>}
        <div>
          {/* Используем posts напрямую, так как API уже вернул нужную страницу */}
          {posts.length === 0 && !error && (
            <div className="text-gray-500 text-center py-10">Посты отсутствуют.</div>
          )}
          {posts.map((post) => (
            // Используем slug как ключ, если id не всегда доступен или slug уникален
            <BlogPostPreview key={post.slug || post.id} post={post} />
          ))}
        </div>
      </div>
      {totalPages > 1 && (
        // Передаем basePath для главной страницы
        <Pagination currentPage={page} totalPages={totalPages} baseUrl="/" />
      )}
    </AnimatedSection>
  );
};

export default Home;
