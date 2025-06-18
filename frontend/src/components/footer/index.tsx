"use client";
import React, { useEffect, useState } from "react";
import { fetchSiteSettings, ApiErrorFormat } from "@/services/api";
/**
 * Компонент Footer — нижний колонтитул сайта с копирайтом и ссылками.
 */
const Footer: React.FC = () => {
  const [siteTitle, setSiteTitle] = useState("MyBlog");

  useEffect(() => {
    fetchSiteSettings()
      .then((data) => setSiteTitle(data.title || "MyBlog"))
      .catch((error: ApiErrorFormat) => {
        console.error(
          "Failed to process site title for footer:",
          error.message,
          error.details,
        );
        setSiteTitle("MyBlog");
      });
  }, []);

  return (
    <footer className="w-full bg-gray-100 py-4 px-6 mt-auto text-center text-gray-500 text-sm">
      <div>
        © {new Date().getFullYear()} {siteTitle}. Все права защищены.
      </div>
    </footer>
  );
};

export default Footer;
