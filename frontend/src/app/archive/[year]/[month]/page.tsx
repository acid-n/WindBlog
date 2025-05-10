import React from "react";
import { notFound } from 'next/navigation';
import { fetchArchiveDaysSummary, DaySummary } from "@/services/api";

interface ArchiveMonthPageProps {
  params: { year: string; month: string };
}

function getMonthName(month: number): string {
  const date = new Date(2000, month - 1, 1);
  return date.toLocaleString("ru-RU", { month: "long" });
}

const ArchiveMonthPage = async ({ params }: ArchiveMonthPageProps) => {
  const { year: yearString, month: monthString } = params;
  const year = parseInt(yearString, 10);
  const month = parseInt(monthString, 10);

  if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
    notFound();
  }

  let daysSummary: DaySummary[] = [];
  let error = "";
  try {
    daysSummary = await fetchArchiveDaysSummary(year, month);
  } catch (e: unknown) {
    error = e instanceof Error ? e.message : "Не удалось получить архив по дням.";
  }

  return (
    <section className="flex flex-col items-center gap-8 py-16 w-full">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">
        Архив за {getMonthName(month)} {year} года
      </h1>
      {error && (
        <div className="text-red-500 text-center">{error}</div>
      )}
      <div className="w-full max-w-xl mt-6">
        <ul className="divide-y divide-gray-200">
          {daysSummary.length === 0 && !error && (
            <li className="text-gray-500 py-6 text-center">Нет постов за этот месяц.</li>
          )}
          {daysSummary.map(({ day, posts_count }) => (
            <li key={day}>
              <a
                href={`/archive/${year}/${month.toString().padStart(2, '0')}/${day.toString().padStart(2, '0')}`}
                className="inline-block px-3 py-1.5 text-lg font-medium text-gray-600 underline decoration-dotted decoration-gray-400 hover:text-gray-900 hover:bg-gray-100 hover:no-underline rounded transition-colors duration-150 ease-in-out"
              >
                {day} {getMonthName(month)}
                <span className="ml-1 text-gray-900">({posts_count})</span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
};

export default ArchiveMonthPage;