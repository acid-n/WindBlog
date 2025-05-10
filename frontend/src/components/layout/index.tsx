import React, { ReactNode } from "react";
import Header from "../header";
import Footer from "../footer";

/**
 * Компонент Layout — основной шаблон страницы с Header и Footer.
 */
interface LayoutProps {
  children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">{children}</main>
      <Footer />
    </div>
  );
};

export default Layout;
