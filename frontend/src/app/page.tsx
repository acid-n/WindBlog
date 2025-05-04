import React from "react";
import { fetchPosts } from "@/services/api";
import type { Post } from "@/types/blog";
import BlogPostPreview from "@/components/blog-post-preview";
import AnimatedSection from "@/components/animated-section";
import Pagination from "@/components/pagination";

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
        {error && <div className="text-red-600 text-center">{error}</div>}
        <div>
          {paginated.length === 0 && !error && (
            <div className="text-gray-500 text-center">Посты отсутствуют.</div>
          )}
          {paginated.map((post) => (
            <BlogPostPreview key={post.id} post={post} />
          ))}
        </div>
      </div>
      {totalPages > 1 && (
        <Pagination page={page} totalPages={totalPages} />
      )}
    </AnimatedSection>
  );
};

export default Home;
