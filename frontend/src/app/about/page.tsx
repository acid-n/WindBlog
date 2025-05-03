import React from "react";

/**
 * Страница 'Обо мне' — информация об авторе.
 */
const AboutPage: React.FC = () => {
  return (
    <section className="flex flex-col items-center gap-8 py-16 w-full">
      <h1 className="text-3xl font-bold text-gray-900">Обо мне</h1>
      <p className="text-gray-600">Здесь будет информация об авторе, фото и ссылки на соцсети.</p>
    </section>
  );
};

export default AboutPage;
