import React from "react";
// Убираем моковые типы и функции
// import type { Post } from "@/types/blog"; // Post не нужен здесь
import { fetchArchiveYearsSummary, YearSummary } from "@/services/api"; // Импортируем реальную функцию и тип

// --- Плейсхолдеры для API --- // Убираем весь этот блок
// interface YearSummary {
//   year: number;
//   posts_count: number;
// }
// async function fetchArchiveYearsSummary(): Promise<YearSummary[]> {
//   console.warn("API call 'fetchArchiveYearsSummary' is not implemented. Using mock data.");
//   return [
//     { year: 2025, posts_count: 15 },
//     { year: 2024, posts_count: 8 },
//   ];
// }
// --- Конец плейсхолдеров ---

/**
 * Страница архива — навигация по годам.
 */
const ArchivePage = async () => {
  let yearsSummary: YearSummary[] = [];
  let error = "";
  try {
    // Используем реальную функцию API
    yearsSummary = await fetchArchiveYearsSummary();
  } catch (e: unknown) {
    const errorMessage = e instanceof Error ? e.message : "An unknown error occurred while fetching archive year summary";
    console.error("Error fetching archive year summary:", errorMessage);
    error = errorMessage; // Сохраняем сообщение об ошибке для отображения
  }
  // Сортировка больше не нужна, API возвращает в нужном порядке (-year)
  // yearsSummary.sort((a, b) => b.year - a.year);

  return (
    <section className="container mx-auto px-4 py-8 md:py-12">
      <h1
        className="font-lora text-[#222] text-3xl md:text-4xl font-medium text-center mb-8"
        style={{ fontFamily: "'Lora', serif" }}
      >
        Архив
      </h1>
      {error && <div className="text-red-600 text-center mb-4">{error}</div>}
      <div className="w-full max-w-3xl mx-auto">
        {yearsSummary.length === 0 && !error && (
          <div className="text-gray-500 text-center py-10">Посты отсутствуют.</div>
        )}
        <ul className="flex flex-wrap justify-center gap-x-4 gap-y-2">
          {yearsSummary.map(({ year, posts_count }) => (
            <li key={year}>
              <a
                href={`/archive/${year}`}
                className="inline-block px-3 py-1.5 text-lg font-medium text-gray-600 underline decoration-dotted decoration-gray-400 hover:text-gray-900 hover:bg-gray-100 hover:no-underline rounded transition-colors duration-150 ease-in-out"
              >
                {year} год{" "}
                <span className="ml-1 text-gray-900">({posts_count})</span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
};

// Вспомогательная функция getPostWord больше не нужна здесь
// function getPostWord(count: number): string {
// ...
// }

export default ArchivePage;
