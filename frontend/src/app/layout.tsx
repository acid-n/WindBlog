import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "@/app/globals.css";
import Layout from "@/components/layout";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MyBlog — MUSSON",
  description: "Блог о технологиях, разработке и жизни. Читайте свежие статьи, обзоры и советы.",
  openGraph: {
    title: "MyBlog — MUSSON",
    description: "Блог о технологиях, разработке и жизни. Читайте свежие статьи, обзоры и советы.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Coustard:wght@400;700&family=Lora:wght@400;700&family=UnifrakturMaguntia&display=swap" rel="stylesheet" />
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
      </head>
      <body className="font-serif text-[#444] bg-[#fff] selection:bg-[#FFFFCF] min-h-screen">
        <Layout>{children}</Layout>
      </body>
    </html>
  );
}
