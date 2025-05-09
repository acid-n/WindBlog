"use client";

import React, { useState, useRef, useEffect } from "react";
import styles from "./styles.module.css";
// Импортируем иконки из react-icons
import { FaShareAlt, FaVk, FaTelegramPlane, FaCopy } from "react-icons/fa";

interface ShareButtonProps {
  title: string;
  url: string;
  shortUrl?: string;
  className?: string;
}

const ShareButton: React.FC<ShareButtonProps> = ({
  title,
  url,
  shortUrl,
  className = "",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const shareUrl = shortUrl || url;

  // Закрытие меню при клике вне компонента
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Сбрасываем "Скопировано" через 3 секунды
  useEffect(() => {
    if (copied) {
      const timer = setTimeout(() => {
        setCopied(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [copied]);

  // Функция для копирования короткой ссылки
  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareUrl).then(
      () => {
        setCopied(true);
        setIsOpen(false);
      },
      (err) => {
        console.error("Не удалось скопировать ссылку: ", err);
      },
    );
  };

  // Подготовка ссылок для шаринга
  const vkShareUrl = `https://vk.com/share.php?url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent(title)}`;
  const telegramShareUrl = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(title)}`;

  return (
    <div className={`relative inline-block ${className}`} ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-transparent border-none text-[#b3b3b3] cursor-pointer p-0 m-0 inline-flex items-center transition-all duration-200 hover:text-[#222]"
        aria-label="Поделиться"
        aria-expanded={isOpen}
      >
        <FaShareAlt />
      </button>

      {isOpen && (
        <div className={styles.shareMenu}>
          <a
            href={vkShareUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.shareMenuItem}
          >
            <FaVk className={styles.shareIcon} />
            ВКонтакте
          </a>

          <a
            href={telegramShareUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.shareMenuItem}
          >
            <FaTelegramPlane className={styles.shareIcon} />
            Телеграм
          </a>

          <button onClick={copyToClipboard} className={styles.shareMenuItem}>
            <FaCopy className={styles.shareIcon} />
            {copied ? "Скопировано!" : "Копировать ссылку"}
          </button>
        </div>
      )}
    </div>
  );
};

export default ShareButton;
