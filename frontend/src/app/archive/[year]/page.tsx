import React from "react";
import { notFound } from 'next/navigation';
import { fetchArchiveMonthsSummary, MonthSummary } from "@/services/api";

// Явно указываем динамический рендеринг
export const dynamic = 'force-dynamic';

// Вспомогательная функция для получения названия месяца на русском
function getMonthName(month: number): string {
    const date = new Date(2000, month - 1, 1); // Год не важен
    return date.toLocaleString("ru-RU", { month: "long" });
}

interface ArchiveYearPageProps {
  params: { year: string };
  // Можно добавить searchParams, если они понадобятся
  // searchParams?: { [key: string]: string | string[] | undefined };
}

/**
 * Страница архива для конкретного года — навигация по месяцам.
 */
const ArchiveYearPage = async ({ params }: ArchiveYearPageProps) => {
  const { year: yearString } = params;
  const year = parseInt(yearString, 10);

  if (isNaN(year)) {
      notFound(); // Если год не числовой, показываем 404
  }

  let monthsSummary: MonthSummary[] = [];
  let error = "";
  try {
    monthsSummary = await fetchArchiveMonthsSummary(year);
  } catch (e: unknown) {
    const errorMessage = e instanceof Error ? e.message : "An unknown error occurred while fetching archive months summary";
    console.error(`Error fetching archive months summary for year ${yearString}:`, errorMessage);
    error = errorMessage;
    if (errorMessage === "Invalid year format" || (e instanceof Error && e.message.includes("404"))) { // Простой пример проверки на 404 из API
      notFound();
    }
  }

  return (
    // Используем общие стили контейнера и отступов
    <section className="container mx-auto px-4 py-8 md:py-12">
      {/* Заголовок страницы - Год */}
      <h1
        className="font-lora text-[#222] text-3xl md:text-4xl font-medium text-center mb-8"
        style={{ fontFamily: "'Lora', serif" }}
      >
        Архив: {year} год
      </h1>
      {error && <div className="text-red-600 text-center mb-4">{error}</div>}
      {/* Центрируем контент */}
      <div className="w-full max-w-3xl mx-auto">
        {monthsSummary.length === 0 && !error && (
          // Корректное сообщение, если нет месяцев с постами
          <div className="text-gray-500 text-center py-10">В {year} году постов нет.</div>
        )}
        {/* Используем flex-wrap для списка месяцев, как для годов */}
        <ul className="flex flex-wrap justify-center gap-x-4 gap-y-2">
          {monthsSummary.map(({ month, posts_count }) => {
             const monthPadded = month.toString().padStart(2, '0'); // Форматируем месяц (01, 02, ..., 12)
             return (
                <li key={month}>
                  <a
                    href={`/archive/${year}/${monthPadded}`} // Ссылка на страницу месяца
                    // Применяем стили, аналогичные тегам и годам
                    className="inline-block px-3 py-1.5 text-lg font-medium text-gray-600 underline decoration-dotted decoration-gray-400 hover:text-gray-900 hover:bg-gray-100 hover:no-underline rounded transition-colors duration-150 ease-in-out capitalize"
                  >
                    {getMonthName(month)}{" "}
                    <span className="ml-1 text-gray-900">({posts_count})</span>
                  </a>
                </li>
              );
            })}
        </ul>
      </div>
    </section>
  );
};

export default ArchiveYearPage; 