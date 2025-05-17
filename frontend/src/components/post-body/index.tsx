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

import { processImageUrlsInJson } from "@/components/tiptap-editor/processImageUrlsInJson";

const PostBody: React.FC<PostBodyProps> = ({ content }) => {
  // Отладка: выводим переменную окружения
  console.log('[DEBUG] NEXT_PUBLIC_DJANGO_MEDIA_URL:', process.env.NEXT_PUBLIC_DJANGO_MEDIA_URL);
  console.log(
    "CONTENT PROP RECEIVED BY PostBody:",
    JSON.stringify(content, null, 2),
  );

  // Обрабатываем src у изображений только на клиенте
  const processedContent = React.useMemo(() => {
    const result = processImageUrlsInJson(content);
    // TipTap Editor ожидает объект, а не массив
    return Array.isArray(result) ? { type: 'doc', content: result } : result;
  }, [content]);

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
