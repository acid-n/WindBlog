"use client"; // Добавляем для useEditor

import React from "react";
import { useEditor, EditorContent, JSONContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import { extendedImage } from "@/lib/tiptapExtensions"; // Используем кастомное расширение
// import Highlight from '@tiptap/extension-highlight';
// import Typography from '@tiptap/extension-typography';

/**
 * Компонент для рендеринга HTML-контента поста.
 */

// Удаляем все определения типов для блоков (TextBlockData, HeadingBlockData, etc., AnyBlock)
// так как компонент теперь будет принимать простую HTML-строку.

interface PostBodyProps {
  content: any;
}

// Вспомогательная функция для рекурсивной обработки URL изображений в JSON Tiptap
const processImageUrlsInJson = (node: any, mediaUrlBase: string): any => {
  if (typeof node === "object" && node !== null && node.type) {
    // console.log(`[PostBody] Processing node type: ${node.type}`, JSON.stringify(node.attrs)); // Убрал этот лог, чтобы не засорять
  }

  if (Array.isArray(node)) {
    return node.map((item) => processImageUrlsInJson(item, mediaUrlBase));
  }

  if (typeof node === "object" && node !== null) {
    const newNode = { ...node };
    if (node.type === "image") {
      // Нашли узел типа 'image'
      // ОТЛАДКА: Логируем весь узел image, чтобы увидеть его структуру
      console.log(
        "[PostBody] Found image node structure:",
        JSON.stringify(node, null, 2),
      );
      if (node.attrs && node.attrs.src && typeof node.attrs.src === "string") {
        console.log("[PostBody] Image node original src:", node.attrs.src);
        if (node.attrs.src.startsWith("/media/")) {
          newNode.attrs.src = `${mediaUrlBase}${node.attrs.src.substring(1)}`;
          console.log("[PostBody] Modified image src to:", newNode.attrs.src);
        } else {
          console.log(
            "[PostBody] Image src does not start with /media/, not modified:",
            node.attrs.src,
          );
        }
      } else {
        console.log(
          "[PostBody] Image node attrs.src is not a string or is missing. Attrs:",
          node.attrs,
        );
      }
    }
    if (node.content) {
      newNode.content = processImageUrlsInJson(node.content, mediaUrlBase);
    }
    return newNode;
  }
  return node;
};

const PostBody: React.FC<PostBodyProps> = ({ content }) => {
  console.log(
    "CONTENT PROP RECEIVED BY PostBody:",
    JSON.stringify(content, null, 2),
  );

  // Получаем base URL для медиа
  const djangoMediaUrl =
    process.env.NEXT_PUBLIC_DJANGO_MEDIA_URL || "http://localhost:8000/media/";
  // Удаляем завершающий слэш для корректной склейки
  const mediaUrlBase = djangoMediaUrl.endsWith("/")
    ? djangoMediaUrl
    : `${djangoMediaUrl}/`;

  // Обрабатываем src у изображений
  const processedContent = React.useMemo(
    () => processImageUrlsInJson(content, mediaUrlBase),
    [content, mediaUrlBase],
  );

  // Инициализируем редактор только для чтения
  const editor = useEditor({
    extensions: [StarterKit, Link, extendedImage],
    content: processedContent,
    editable: false,
  });

  if (!editor) {
    return (
      <div className="prose">
        <p>Загрузка контента...</p>
      </div>
    );
  }

  return (
    <div className="prose prose-lg w-full text-[#444]">
      <EditorContent editor={editor} />
    </div>
  );
};

export default PostBody;
