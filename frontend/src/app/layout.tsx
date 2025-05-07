import type { Metadata } from "next";
import { Lora, Coustard } from "next/font/google";
import "@/app/globals.css";
import Layout from "@/components/layout";

const lora = Lora({
  subsets: ["latin", "cyrillic"],
  variable: "--font-lora",
  weight: ["400", "700"],
});

const coustard = Coustard({
  subsets: ["latin"],
  variable: "--font-coustard",
  weight: ["400", "900"],
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
    <html lang="ru" className={`${lora.variable} ${coustard.variable}`}>
      <head>
        <link href="https://fonts.googleapis.com/css2?family=UnifrakturMaguntia&display=swap" rel="stylesheet" />
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
      </head>
      <body className="font-serif text-text bg-bg selection:bg-[#FFFFCF] min-h-screen">
        <Layout>{children}</Layout>
      </body>
    </html>
  );
}
