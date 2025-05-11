"use client"; // Добавляем для useEditor

import React from "react";
import { useEditor, EditorContent, JSONContent } from "@tiptap/react";
import styles from "./styles.module.css";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import { extendedImage } from "@/lib/tiptapExtensions"; // Используем кастомное расширение
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import CodeBlock from '@tiptap/extension-code-block';
// import Highlight from '@tiptap/extension-highlight';
import Typography from '@tiptap/extension-typography';
import { GalleryNode } from "@/lib/tiptapGalleryExtension";

/**
 * Компонент для рендеринга HTML-контента поста.
 */

// Удаляем все определения типов для блоков (TextBlockData, HeadingBlockData, etc., AnyBlock)
// так как компонент теперь будет принимать простую HTML-строку.

interface PostBodyProps {
  content: JSONContent;
}

// Вспомогательная функция для рекурсивной обработки URL изображений в JSON Tiptap
const processImageUrlsInJson = (node: JSONContent, mediaUrlBase: string): JSONContent | JSONContent[] => {
  if (typeof node === "object" && node !== null && 'type' in node) {
    // Здесь node гарантированно JSONContent
    // console.log(`[PostBody] Processing node type: ${node.type}`, JSON.stringify((node as unknown).attrs));
  }

  if (Array.isArray(node)) {
    return node.map((child) => processImageUrlsInJson(child, mediaUrlBase)) as JSONContent[];
  }

  if (typeof node === "object" && node !== null && 'content' in node && Array.isArray((node as any).content)) {
    return {
      ...node,
      content: (node as any).content.map((child: JSONContent) => processImageUrlsInJson(child, mediaUrlBase)),
    } as JSONContent;
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
      if (newNode.attrs?.src && typeof newNode.attrs?.src === "string") {
        console.log("[PostBody] Image node original src:", newNode.attrs?.src);
        if (newNode.attrs?.src && newNode.attrs.src.startsWith("/media/")) {
          if (newNode.attrs) newNode.attrs.src = `${mediaUrlBase}${newNode.attrs.src.substring(1)}`;
          console.log("[PostBody] Modified image src to:", newNode.attrs?.src);
        } else {
          console.log(
            "[PostBody] Image src does not start with /media/, not modified:",
            node.attrs?.src,
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
      const processed = processImageUrlsInJson(node.content, mediaUrlBase);
      newNode.content = Array.isArray(processed) ? processed : [processed];
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
  const processedContent = React.useMemo(() => {
    const result = processImageUrlsInJson(content, mediaUrlBase);
    // TipTap Editor ожидает объект, а не массив
    return Array.isArray(result) ? { type: 'doc', content: result } : result;
  }, [content, mediaUrlBase]);

  // Инициализируем редактор только для чтения
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Link,
      extendedImage,
      Table.configure({ resizable: true }),
      TableRow,
      TableCell,
      TableHeader,
      CodeBlock.configure({
        languageClassPrefix: 'language-',
      }),
      Typography,
      GalleryNode,
    ],
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
    <>
      <EditorContent editor={editor} className="prose prose-lg max-w-none w-full text-[#444]" />
    </>
  );
};

export default PostBody;
