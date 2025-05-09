"use client";
import React, { useEffect, useState } from "react";
import styles from "./styles.module.css";

/**
 * Компонент Footer — нижний колонтитул сайта с копирайтом и ссылками.
 */
const Footer: React.FC = () => {
  const [siteTitle, setSiteTitle] = useState("MyBlog");

  useEffect(() => {
    const djangoApiBaseUrl =
      process.env.NEXT_PUBLIC_DJANGO_API_URL || "http://localhost:8000";
    const siteSettingsUrl = new URL(
      "/api/v1/site-settings",
      djangoApiBaseUrl,
    ).toString();

    fetch(siteSettingsUrl)
      .then((res) => {
        if (!res.ok) {
          console.error(
            `Error fetching site settings for footer: ${res.status} ${res.statusText}`,
          );
          return { site_title: "MyBlog" };
        }
        return res.json();
      })
      .then((data) => setSiteTitle(data.site_title || "MyBlog"))
      .catch((error) => {
        console.error("Failed to process site title for footer:", error);
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
