"use client";
import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { fetchSiteSettings, SiteSettingsData, ApiErrorFormat } from "@/services/api";

const MENU = [
  { href: "/", label: "Главная" },
  { href: "/tags", label: "Теги" },
  { href: "/archive", label: "Архив" },
  { href: "/about", label: "Обо мне" },
  { href: "/contact", label: "Контакты" },
];

/**
 * Header — MUSSON UX/UI STYLE GUIDE, структура и стили как в Read WP.
 */
const Header: React.FC = () => {
  const [settings, setSettings] = useState<SiteSettingsData>({ site_title: "MyBlog", site_description: "" });
  const [searchOpen, setSearchOpen] = useState(false);
  const pathname = usePathname();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const data = await fetchSiteSettings();
        setSettings(data);
      } catch (error) {
        const apiError = error as ApiErrorFormat;
        console.error("Ошибка загрузки настроек сайта:", apiError.message, apiError.details);
        setSettings({ site_title: "Блог", site_description: "Ошибка загрузки описания" });
      }
    };
    loadSettings();
  }, []);

  useEffect(() => {
    if (searchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [searchOpen]);

  return (
    <header className="site-header w-full bg-white border-b border-gray-100">
      <div className="container flex flex-col items-center">
        <h1 className="site-title mb-0">
          <Link href="/" aria-label="На главную" className="text-gray-800 no-underline">{settings.site_title}</Link>
        </h1>
        <div className="site-title-sep" />
        {settings.site_description && (
          <h2 className="site-description">{settings.site_description}</h2>
        )}
        <div className="menu-sep" />
        <nav className="main-navigation w-full">
          <ul className="flex justify-center items-center font-heading text-lg font-normal text-center relative min-w-[700px]">
            {MENU.map((item) => (
              <li
                key={item.href}
                className={`flex items-center h-[38px] transition-all duration-300 ${pathname === item.href ? "current-menu-item" : ""}`}>
                <Link
                  href={item.href}
                  className="px-[1.2em] whitespace-nowrap h-[38px] flex items-center"
                  aria-current={pathname === item.href ? "page" : undefined}
                >
                  {item.label}
                </Link>
              </li>
            ))}
            <motion.li
              className="flex items-center h-[38px] transition-all duration-300 overflow-hidden"
              style={{ width: searchOpen ? 260 : 140 }}
              initial={false}
              animate={{ width: searchOpen ? 260 : 140 }}
              transition={{ duration: 0.32, ease: [0.4, 0, 0.2, 1] }}
              layout
            >
              <AnimatePresence initial={false} mode="wait">
                {!searchOpen ? (
                  <motion.span
                    key="search-text"
                    layoutId="search-morph"
                    className="inline-flex items-center w-full justify-center cursor-pointer px-[1.2em] h-[38px] whitespace-nowrap"
                    style={{ userSelect: 'none' }}
                    onClick={() => setSearchOpen(true)}
                    initial={{ opacity: 1 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, transition: { duration: 0.18 } }}
                    transition={{ duration: 0.18 }}
                  >
                    Поиск <span className="ml-2">→</span>
                  </motion.span>
                ) : (
                  <motion.form
                    key="search-input"
                    layoutId="search-morph"
                    className="flex items-center w-full h-[38px] px-0"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, transition: { duration: 0.18 } }}
                    transition={{ duration: 0.22 }}
                    onSubmit={e => {
                      e.preventDefault();
                      if (searchInputRef.current?.value) {
                        router.push(`/search?q=${encodeURIComponent(searchInputRef.current.value)}`);
                      }
                      setSearchOpen(false);
                    }}
                  >
                    <input
                      ref={searchInputRef}
                      type="text"
                      placeholder="Введите запрос..."
                      className="border-none border-b border-dotted border-gray-400 focus:border-accent focus:border-solid rounded-none px-[1.2em] py-0 text-lg font-heading h-[32px] leading-none text-gray-800 bg-white focus:outline-none focus:shadow-none transition-colors w-full text-center placeholder:italic placeholder:text-gray-400"
                      autoFocus
                      onBlur={() => setSearchOpen(false)}
                      onKeyDown={e => { if (e.key === "Escape") setSearchOpen(false); }}
                      aria-label="Поиск по сайту"
                    />
                    <button
                      type="submit"
                      className="ml-2 text-gray-800 hover:text-accentDark transition-colors text-xl bg-transparent border-none p-0 cursor-pointer"
                      tabIndex={0}
                      aria-label="Выполнить поиск"
                    >
                      →
                    </button>
                  </motion.form>
                )}
              </AnimatePresence>
            </motion.li>
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default Header;
