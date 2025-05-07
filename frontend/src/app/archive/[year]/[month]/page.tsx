import React from "react";
import { notFound } from 'next/navigation';
import { fetchArchiveDaysSummary, DaySummary } from "@/services/api";
// Импортируем date-fns для форматирования
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

// Явно указываем динамический рендеринг
export const dynamic = 'force-dynamic';

// --- Плейсхолдеры для API ---
// interface DaySummary {
//   day: number; // 1-31
//   posts_count: number;
// }
// async function fetchArchiveDaysSummary(year: number, month: number): Promise<DaySummary[]> {
//   console.warn(`API call 'fetchArchiveDaysSummary(${year}, ${month})' is not implemented. Using mock data.`);
//   if (year === 2025 && month === 5) { /*...*/ }
//   if (year === 2025 && month === 4) { /*...*/ }
//   if (year === 2025 && month === 1) { /*...*/ }
//   if (year === 2024 && month === 11) { /*...*/ }
//   return [];
// }
// --- Конец плейсхолдеров ---

// Вспомогательная функция для правильного склонения слова "пост"
function getPostWord(count: number): string {
    const lastDigit = count % 10;
    const lastTwoDigits = count % 100;
    if (lastTwoDigits >= 11 && lastTwoDigits <= 19) {
      return "постов";
    }
    if (lastDigit === 1) {
      return "пост";
    }
    if (lastDigit >= 2 && lastDigit <= 4) {
      return "поста";
    }
    return "постов";
}

interface ArchiveMonthPageProps {
  params: Promise<{ year: string; month: string }>;
  // searchParams?: { [key: string]: string | string[] | undefined };
}

/**
 * Страница архива для конкретного месяца — навигация по дням.
 */
// Изменяем сигнатуру: params теперь Promise
const ArchiveMonthPage = async ({ params: paramsPromise }: ArchiveMonthPageProps) => {
  // Доступ к параметрам через await самого Promise
  const params = await paramsPromise;
  const yearString = params.year;
  const monthString = params.month;
  const year = parseInt(yearString, 10);
  const month = parseInt(monthString, 10); // Месяц приходит как 01, 02...

  if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
      notFound(); // Если год/месяц некорректны
  }

  const monthPadded = monthString; // Используем исходную строку '01', '02'...

  let daysSummary: DaySummary[] = [];
  let error = "";
  try {
    daysSummary = await fetchArchiveDaysSummary(year, month);
  } catch (e: unknown) {
    const errorMessage = e instanceof Error ? e.message : "An unknown error occurred while fetching posts for archive";
    console.error(`Error fetching posts for archive ${year}/${month}:`, errorMessage);
    // Для страницы архива, если посты не загрузились, можно показать сообщение или 404
    //notFound(); // Если считаем это критической ошибкой загрузки страницы
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold text-red-600">Ошибка загрузки архива</h1>
        <p className="text-gray-700">Не удалось получить посты для указанного периода. Пожалуйста, попробуйте позже.</p>
      </div>
    );
  }

  // Получаем название месяца для заголовка
  const pageTitleMonthName = format(new Date(year, month - 1, 1), 'LLLL', { locale: ru });

  return (
    // Используем общие стили контейнера и отступов
    <section className="container mx-auto px-4 py-8 md:py-12">
      {/* Заголовок страницы - Месяц Год */}
      <h1
        className="font-lora text-[#222] text-3xl md:text-4xl font-medium text-center mb-8 capitalize"
        style={{ fontFamily: "'Lora', serif" }}
      >
        Архив: {pageTitleMonthName} {year} года
      </h1>
      {error && <div className="text-red-600 text-center mb-4">{error}</div>}
      {/* Центрируем контент */}
      <div className="w-full max-w-3xl mx-auto">
        {daysSummary.length === 0 && !error && (
          // Корректное сообщение, если нет дней с постами
          <div className="text-gray-500 text-center py-10">
            В {pageTitleMonthName.toLowerCase()} {year} года постов нет.
          </div>
        )}
        {/* Используем flex-wrap для списка дней, как для месяцев/годов */}
        <ul className="flex flex-wrap justify-center gap-x-4 gap-y-2">
          {daysSummary.map(({ day, posts_count }) => {
             const dayPadded = day.toString().padStart(2, '0'); // Форматируем день (01, 02,...)
             // Форматируем дату для отображения ссылки
             const linkDate = new Date(year, month - 1, day);
             const formattedLinkDate = format(linkDate, 'd MMMM', { locale: ru });
             return (
                <li key={day}>
                  <a
                    href={`/archive/${year}/${monthPadded}/${dayPadded}`} // Ссылка на страницу дня
                    // Применяем стили, аналогичные верхним уровням
                    className="inline-block px-3 py-1.5 text-lg font-medium text-gray-600 underline decoration-dotted decoration-gray-400 hover:text-gray-900 hover:bg-gray-100 hover:no-underline rounded transition-colors duration-150 ease-in-out"
                  >
                    {/* Используем отформатированную дату */}
                    {formattedLinkDate}
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

export default ArchiveMonthPage; 