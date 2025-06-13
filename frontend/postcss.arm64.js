// Конфигурация PostCSS, не использующая lightning-css
module.exports = {
  plugins: {
    // Используем стандартный вложенный синтаксис CSS
    'postcss-nested': {},
    
    // Стандартный Tailwind CSS
    tailwindcss: {},
    
    // Автопрефиксер для кросс-браузерной совместимости
    autoprefixer: {},
  },
};
