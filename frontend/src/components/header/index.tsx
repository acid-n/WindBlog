"use client";
import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

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
  const [settings, setSettings] = useState({ site_title: "MyBlog", site_description: "" });
  const [searchOpen, setSearchOpen] = useState(false);
  const pathname = usePathname();
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/v1/site-settings")
      .then((res) => res.json())
      .then((data) => setSettings(data));
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
          <Link href="/" aria-label="На главную">{settings.site_title}</Link>
        </h1>
        <div className="site-title-sep" />
        {settings.site_description && (
          <h2 className="site-description">{settings.site_description}</h2>
        )}
        <div className="menu-sep" />
        <nav className="main-navigation w-full">
          <ul className="flex justify-center items-center font-coustard font-normal text-[18px] relative min-w-[700px]">
            {MENU.map((item) => (
              <li
                key={item.href}
                className={
                  (pathname === item.href ? "current-menu-item" : "") +
                  " flex items-center h-[38px] transition-all duration-300"
                }
              >
                <Link
                  href={item.href}
                  className={
                    (pathname === item.href
                      ? "text-[#CE6607] font-bold"
                      : "text-[#222] hover:text-[#A35208] transition-colors") +
                    " px-[1.2em] whitespace-nowrap h-[38px] flex items-center"
                  }
                  aria-current={pathname === item.href ? "page" : undefined}
                >
                  {item.label}
                </Link>
              </li>
            ))}
            <motion.li
              className="flex items-center h-[38px] transition-all duration-300 overflow-hidden"
              style={{ width: searchOpen ? 260 : 120, minWidth: 120, maxWidth: 260 }}
              initial={false}
              animate={{ width: searchOpen ? 260 : 120 }}
              transition={{ duration: 0.32, ease: [0.4, 0, 0.2, 1] }}
              layout
            >
              <AnimatePresence initial={false} mode="wait">
                {!searchOpen ? (
                  <motion.span
                    key="search-text"
                    layoutId="search-morph"
                    className="inline-flex items-center w-full justify-center cursor-pointer px-[1.2em] h-[38px]"
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
                    onSubmit={e => { e.preventDefault(); setSearchOpen(false); }}
                  >
                    <input
                      ref={searchInputRef}
                      type="text"
                      placeholder="Введите запрос..."
                      className="border-none border-b border-dotted border-[#bbb] focus:border-[#CE6607] focus:border-solid rounded-none px-[1.2em] py-0 text-[18px] font-coustard h-[32px] leading-none text-[#222] bg-white focus:outline-none focus:shadow-none transition-colors w-full text-center placeholder:italic placeholder:text-[#bbb]"
                      autoFocus
                      onBlur={() => setSearchOpen(false)}
                      onKeyDown={e => { if (e.key === "Escape") setSearchOpen(false); }}
                      aria-label="Поиск по сайту"
                      style={{ transition: 'all 0.22s' }}
                    />
                    <button
                      type="submit"
                      className="ml-2 text-[#222] hover:text-[#A35208] transition-colors text-xl"
                      tabIndex={0}
                      aria-label="Выполнить поиск"
                      style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
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
