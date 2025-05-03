import React from "react";
import { fetchPosts } from "@/services/api";
import type { Post } from "@/types/blog";
import PostCard from "@/components/post-card";
import AnimatedSection from "@/components/animated-section";

const POSTS_PER_PAGE = 10;

const Home = async (props: any) => {
  const searchParams = props?.searchParams || {};
  const page = Number(searchParams.page) > 0 ? Number(searchParams.page) : 1;
  let posts: Post[] = [];
  let error = "";
  try {
    posts = await fetchPosts();
  } catch (e: any) {
    error = e?.message || "Ошибка загрузки постов";
  }
  const total = posts.length;
  const paginated = posts.slice((page - 1) * POSTS_PER_PAGE, page * POSTS_PER_PAGE);
  const totalPages = Math.ceil(total / POSTS_PER_PAGE);

  return (
    <AnimatedSection
      className="flex flex-col items-center gap-8 pt-[40px] w-full bg-white"
      ariaLabel="Последние статьи"
    >
      <div className="container w-full">
        <h1
          className="font-coustard text-[40px] font-bold text-[#333] mb-[40px] text-center tracking-normal leading-tight mx-auto"
          style={{ letterSpacing: '0', lineHeight: 1.1 }}
        >
          Последние статьи
        </h1>
        {error && <div className="text-red-600 text-center">{error}</div>}
        <div className="[column-count:1] md:[column-count:2] gap-[24px] [column-gap:24px]">
          {paginated.length === 0 && !error && (
            <div className="text-gray-500 text-center col-span-full">Посты отсутствуют.</div>
          )}
          {paginated.map((post) => (
            <div key={post.id} className="break-inside-avoid mb-[24px]">
              <PostCard post={post} />
            </div>
          ))}
        </div>
      </div>
      {totalPages > 1 && (
        <div className="flex gap-4 mt-12">
          <a
            href={`/?page=${page - 1}`}
            className={`px-6 py-2 rounded-lg border font-heading text-base shadow transition-colors ${page === 1 ? "text-gray-400 border-gray-200 cursor-not-allowed" : "text-[#CE6607] border-[#CE6607] hover:bg-[#CE6607] hover:text-white"}`}
            aria-disabled={page === 1}
            tabIndex={page === 1 ? -1 : 0}
          >
            <i className="fa fa-chevron-left mr-2" aria-hidden="true"></i>Назад
          </a>
          <span className="px-6 py-2 text-[#333] font-heading text-base">{page} / {totalPages}</span>
          <a
            href={`/?page=${page + 1}`}
            className={`px-6 py-2 rounded-lg border font-heading text-base shadow transition-colors ${page === totalPages ? "text-gray-400 border-gray-200 cursor-not-allowed" : "text-[#CE6607] border-[#CE6607] hover:bg-[#CE6607] hover:text-white"}`}
            aria-disabled={page === totalPages}
            tabIndex={page === totalPages ? -1 : 0}
          >
            Вперёд<i className="fa fa-chevron-right ml-2" aria-hidden="true"></i>
          </a>
        </div>
      )}
    </AnimatedSection>
  );
};

export default Home;
