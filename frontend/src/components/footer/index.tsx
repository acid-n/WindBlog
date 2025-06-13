"use client";
import React, { useEffect, useState } from "react";
import { fetchSiteSettings } from "@/services/api";


/**
 * Компонент Footer — нижний колонтитул сайта с копирайтом и ссылками.
 */
const Footer: React.FC = () => {
  const [siteTitle, setSiteTitle] = useState("MyBlog");

  useEffect(() => {
    // Используем централизованный API-сервис для получения настроек сайта
    fetchSiteSettings()
      .then((data) => {
        setSiteTitle(data.site_title || "MyBlog");
      })
      .catch((error) => {
        console.error("Ошибка при загрузке настроек сайта для футера:", error);
        setSiteTitle("MyBlog"); // Значение по умолчанию при ошибке
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
