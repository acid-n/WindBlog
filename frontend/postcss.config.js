// Стандартная конфигурация PostCSS без зависимости от lightningcss
module.exports = {
  plugins: {
    // Используем postcss-nested для вложенных стилей
    'postcss-nested': {},
    // Используем @tailwindcss/postcss вместо прямого tailwindcss
    '@tailwindcss/postcss': {},
    'autoprefixer': {}
  }
};