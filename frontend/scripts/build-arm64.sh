#!/bin/bash
set -e

# Скрипт для подготовки и сборки фронтенд-приложения на ARM64
echo "🔧 Подготовка Next.js к сборке на ARM64..."

# Создаем директорию для скриптов, если она не существует
mkdir -p scripts

# Проверяем и создаем директорию для модулей utils и lib, если не существуют
mkdir -p src/utils src/lib

# Создаем модуль для работы с медиа, если он не существует
if [ ! -f src/utils/media.ts ]; then
  echo "Создаем модуль media.ts..."
  cat > src/utils/media.ts << 'EOL'
/**
 * Утилиты для работы с медиа-файлами
 */

/**
 * Преобразует относительный путь медиа в полный URL для клиентской стороны
 */
export const getClientMediaUrl = (src: string): string => {
  // Базовый URL медиа-сервера из переменных окружения
  const mediaBaseUrl = process.env.NEXT_PUBLIC_DJANGO_MEDIA_URL || '';
  
  // Если URL абсолютный, возвращаем как есть
  if (src.startsWith('http://') || src.startsWith('https://')) {
    return src;
  }
  
  // Если URL начинается с '/', добавляем базовый URL
  if (src.startsWith('/')) {
    return `${mediaBaseUrl}${src}`;
  }
  
  // Иначе считаем, что это относительный путь, и добавляем слеш
  return `${mediaBaseUrl}/${src}`;
};
EOL
fi

# Создаем модуль расширения для TipTap, если он не существует
if [ ! -d src/lib ]; then
  mkdir -p src/lib
fi

if [ ! -f src/lib/tiptapExtensions.ts ]; then
  echo "Создаем модуль tiptapExtensions.ts..."
  cat > src/lib/tiptapExtensions.ts << 'EOL'
import Image from '@tiptap/extension-image';

// Расширенное изображение с поддержкой выравнивания
export const extendedImage = Image.configure({
  allowBase64: true,
  inline: false,
}).extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      align: {
        default: null,
        parseHTML: element => element.getAttribute('data-align'),
        renderHTML: attributes => {
          if (!attributes.align) {
            return {};
          }
          return {
            'data-align': attributes.align,
            class: `align-${attributes.align}`,
          };
        },
      },
    };
  },
});
EOL
fi

if [ ! -f src/lib/tiptapGalleryExtension.ts ]; then
  echo "Создаем модуль tiptapGalleryExtension.ts..."
  cat > src/lib/tiptapGalleryExtension.ts << 'EOL'
import { Node, mergeAttributes } from '@tiptap/core';

export interface GalleryOptions {
  HTMLAttributes: Record<string, any>;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    gallery: {
      /**
       * Добавляет галерею изображений
       */
      setGallery: (options: { images: { src: string; alt: string }[] }) => ReturnType;
    };
  }
}

export const GalleryNode = Node.create<GalleryOptions>({
  name: 'gallery',
  
  group: 'block',
  
  content: '',
  
  marks: '',
  
  draggable: true,

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },
  
  addAttributes() {
    return {
      images: {
        default: [],
        parseHTML: element => {
          const images = element.getAttribute('data-images');
          return images ? JSON.parse(images) : [];
        },
        renderHTML: attributes => {
          if (!attributes.images) {
            return {};
          }
          return {
            'data-images': JSON.stringify(attributes.images),
          };
        },
      },
    };
  },
  
  parseHTML() {
    return [
      {
        tag: 'div[data-type="gallery"]',
      },
    ];
  },
  
  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(
        { 'data-type': 'gallery', class: 'tiptap-gallery' },
        this.options.HTMLAttributes,
        HTMLAttributes
      ),
      '',
    ];
  },
  
  addCommands() {
    return {
      setGallery: options => ({ commands }) => {
        return commands.insertContent({
          type: this.name,
          attrs: {
            images: options.images,
          },
        });
      },
    };
  },
});
EOL
fi

# Создаем модуль для обработки изображений в TipTap, если он не существует
if [ ! -f src/components/tiptap-editor/processImageUrlsInJson.ts ]; then
  echo "Создаем модуль processImageUrlsInJson.ts..."
  mkdir -p src/components/tiptap-editor
  cat > src/components/tiptap-editor/processImageUrlsInJson.ts << 'EOL'
import { getClientMediaUrl } from "@/utils/media";

// Преобразует относительные URL в абсолютные для изображений в JSON документе Tiptap
export const processImageUrlsInJson = (content: any): any => {
  if (!content) return content;

  // Функция рекурсивного обхода JSON
  const processNode = (node: any): any => {
    if (!node) return node;

    // Обработка массивов
    if (Array.isArray(node)) {
      return node.map(item => processNode(item));
    }

    // Обработка объектов
    if (typeof node === 'object') {
      // Если это узел изображения с атрибутом src, обрабатываем его
      if (node.type === 'image' && node.attrs && node.attrs.src) {
        return {
          ...node,
          attrs: {
            ...node.attrs,
            src: getClientMediaUrl(node.attrs.src),
          },
        };
      }
      
      // Если это узел галереи, обрабатываем все изображения в нем
      if (node.type === 'gallery' && node.attrs && node.attrs.images) {
        return {
          ...node,
          attrs: {
            ...node.attrs,
            images: node.attrs.images.map((img: any) => ({
              ...img,
              src: getClientMediaUrl(img.src),
            })),
          },
        };
      }

      // Рекурсивно обходим вложенные поля объекта
      const result: any = {};
      for (const key in node) {
        result[key] = processNode(node[key]);
      }
      return result;
    }

    // Примитивные типы возвращаем как есть
    return node;
  };

  return processNode(content);
};
EOL
fi

# Создаем заглушку для lightningcss, если она не существует
if [ ! -f noop-module.js ]; then
  echo "Создаем заглушку для lightningcss..."
  cat > noop-module.js << 'EOL'
/**
 * Заглушка для lightningcss
 * Решает проблему с нативными модулями в Docker на ARM64
 */

// Экспортируем пустую функцию трансформации
exports.transform = function transform() {
  return {
    code: '',
    map: null,
    warnings: [],
  };
};

// Экспортируем другие необходимые методы как заглушки
exports.bundle = function() {
  return {
    code: '',
    map: null,
  };
};

exports.browserslistToTargets = function() {
  return {};
};

// Нужные константы для PostCSS и других интеграций
exports.Features = {
  Nesting: 1 << 0,
  CustomMedia: 1 << 1,
  // и т.д.
};
EOL
fi

# Создаем оптимизированный postcss.config.js
echo "Создаем оптимизированный postcss.config.js..."
cat > postcss.config.js << 'EOL'
module.exports = {
  plugins: {
    'tailwindcss/nesting': {},
    tailwindcss: {},
    autoprefixer: {},
  },
};
EOL

# Копируем оптимизированный next.config.js
echo "Применяем оптимизированную конфигурацию Next.js..."
cp next.config.arm64.js next.config.js

# Экспортируем переменные окружения для отключения проблемных функций
export NEXT_PRIVATE_IGNORE_LIGHTNINGCSS=1
export NEXT_DISABLE_LIGHTNINGCSS=1
export NODE_OPTIONS="--no-experimental-fetch"

# Запускаем сборку Next.js
echo "🚀 Запускаем сборку статического сайта Next.js..."
npm run build

echo "✅ Сборка завершена! Статический сайт готов для деплоя на ARM64."
