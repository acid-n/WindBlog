import React from "react";
import styles from "./styles.module.css";

interface PaginationProps {
  page: number;
  totalPages: number;
}

const Pagination: React.FC<PaginationProps> = ({ page, totalPages }) => (
  <nav>
    <ul className={styles.pagination}>
      {page > 1 && (
        <li>
          <a href={`/?page=${page - 1}`} className={styles["pagination-link"]}>Назад</a>
        </li>
      )}
      {Array.from({ length: totalPages }, (_, i) => (
        <li key={i + 1}>
          {page === i + 1 ? (
            <span className={styles["pagination-active"]}>{i + 1}</span>
          ) : (
            <a href={`/?page=${i + 1}`} className={styles["pagination-link"]}>{i + 1}</a>
          )}
        </li>
      ))}
      {page < totalPages && (
        <li>
          <a href={`/?page=${page + 1}`} className={styles["pagination-link"]}>Вперёд</a>
        </li>
      )}
    </ul>
  </nav>
);

export default Pagination; 