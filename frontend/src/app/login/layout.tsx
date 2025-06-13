import { Metadata } from 'next/types';

/**
 * Метаданные для страницы авторизации
 * Определены в серверном компоненте согласно правилам Next.js 14+
 */
export const metadata: Metadata = {
  title: "NoEon - Авторизация",
  description: "Авторизация в системе управления блогом NoEon",
  robots: "noindex, nofollow"
};

/**
 * Серверный компонент макета для страницы авторизации
 * Содержит метаданные и общий макет страницы
 */
export default function LoginLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children;
}
