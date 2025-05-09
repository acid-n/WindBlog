import React from "react";
import Link from "next/link";
import styles from "./styles.module.css";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  baseUrl: string; // Унифицированный prop для базового URL
  // searchParams?: URLSearchParams; // Для сохранения других параметров запроса
}

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  baseUrl,
}) => {
  const getPageUrl = (pageNum: number) => {
    const url = new URL(baseUrl, "http://localhost"); // Временный base для конструктора URL
    url.searchParams.set("page", pageNum.toString());
    return `${url.pathname}${url.search}`;
  };

  // Не отображаем пагинацию, если всего одна страница или меньше
  if (totalPages <= 1) {
    return null;
  }

  const pageNumbers = [];
  const maxPagesToShow = 5; // Максимальное количество номеров страниц для отображения
  const halfPagesToShow = Math.floor(maxPagesToShow / 2);

  let startPage = Math.max(1, currentPage - halfPagesToShow);
  let endPage = Math.min(totalPages, currentPage + halfPagesToShow);

  if (currentPage - halfPagesToShow <= 0) {
    endPage = Math.min(totalPages, maxPagesToShow);
  }

  if (currentPage + halfPagesToShow >= totalPages) {
    startPage = Math.max(1, totalPages - maxPagesToShow + 1);
  }

  for (let i = startPage; i <= endPage; i++) {
    pageNumbers.push(i);
  }

  return (
    <nav aria-label="Пагинация" className="flex justify-center mt-8 mb-4">
      <ul className={styles.paginationList}>
        {currentPage > 1 && (
          <li>
            <Link
              href={getPageUrl(currentPage - 1)}
              className={styles.paginationLink}
              aria-label="Предыдущая страница"
            >
              Назад
            </Link>
          </li>
        )}

        {startPage > 1 && (
          <>
            <li>
              <Link href={getPageUrl(1)} className={styles.paginationLink}>
                1
              </Link>
            </li>
            {startPage > 2 && (
              <li>
                <span className={styles.paginationEllipsis}>...</span>
              </li>
            )}
          </>
        )}

        {pageNumbers.map((pageNum) => (
          <li key={pageNum}>
            {currentPage === pageNum ? (
              <span className={styles.paginationActive} aria-current="page">
                {pageNum}
              </span>
            ) : (
              <Link
                href={getPageUrl(pageNum)}
                className={styles.paginationLink}
              >
                {pageNum}
              </Link>
            )}
          </li>
        ))}

        {endPage < totalPages && (
          <>
            {endPage < totalPages - 1 && (
              <li>
                <span className={styles.paginationEllipsis}>...</span>
              </li>
            )}
            <li>
              <Link
                href={getPageUrl(totalPages)}
                className={styles.paginationLink}
              >
                {totalPages}
              </Link>
            </li>
          </>
        )}

        {currentPage < totalPages && (
          <li>
            <Link
              href={getPageUrl(currentPage + 1)}
              className={styles.paginationLink}
              aria-label="Следующая страница"
            >
              Вперёд
            </Link>
          </li>
        )}
      </ul>
    </nav>
  );
};

export default Pagination;
