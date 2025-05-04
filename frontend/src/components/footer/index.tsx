"use client";
import React, { useEffect, useState } from "react";
import styles from "./styles.module.css";

/**
 * Компонент Footer — нижний колонтитул сайта с копирайтом и ссылками.
 */
const Footer: React.FC = () => {
  const [siteTitle, setSiteTitle] = useState("MyBlog");

  useEffect(() => {
    fetch("/api/v1/site-settings")
      .then((res) => res.json())
      .then((data) => setSiteTitle(data.site_title || "MyBlog"));
  }, []);

  return (
    <footer className="w-full bg-gray-100 py-4 px-6 mt-auto text-center text-gray-500 text-sm">
      <div>© {new Date().getFullYear()} {siteTitle}. Все права защищены.</div>
    </footer>
  );
};

export default Footer;
