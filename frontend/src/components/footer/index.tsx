import React from "react";
import styles from "./styles.module.css";

/**
 * Компонент Footer — нижний колонтитул сайта с копирайтом и ссылками.
 */
const Footer: React.FC = () => {
  return (
    <footer className="w-full bg-gray-100 py-4 px-6 mt-auto text-center text-gray-500 text-sm">
      <div>© {new Date().getFullYear()} MyBlog. Все права защищены.</div>
    </footer>
  );
};

export default Footer;
