import React from "react";

/**
 * Страница контактов — форма обратной связи (заглушка).
 */
const ContactPage: React.FC = () => {
  return (
    <section className="flex flex-col items-center justify-center gap-8 py-16">
      <h1 className="text-3xl font-bold text-gray-900">Контакты</h1>
      <p className="text-lg text-gray-600 text-center max-w-xl">
        Здесь будет форма обратной связи. Реализация и интеграция с backend — на следующих этапах.
      </p>
    </section>
  );
};

export default ContactPage;
