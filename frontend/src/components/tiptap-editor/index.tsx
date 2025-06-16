"use client";

import React, { useCallback, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Table from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import CodeBlock from "@tiptap/extension-code-block";

import TextAlign from "@tiptap/extension-text-align";
import { Color } from "@tiptap/extension-color";
import TextStyle from "@tiptap/extension-text-style";
import Highlight from "@tiptap/extension-highlight";
import Link from "@tiptap/extension-link";

import { GalleryNode } from "@/lib/tiptapGalleryExtension"; // NEW
import { getBackendOrigin } from "@/lib/getBaseUrl";
import {
  FaBold,
  FaItalic,
  FaStrikethrough,
  FaCode,
  FaParagraph,
  FaHeading,
  FaListUl,
  FaListOl,
  FaQuoteLeft,
  FaUndo,
  FaRedo,
  FaImage,
  FaMinus,
  FaFileCode,
  FaLink,
  FaUnlink,
  FaHighlighter,
  FaAlignCenter,
  FaAlignLeft,
  FaAlignRight,
  FaAlignJustify,
  FaPalette,
  FaAlignJustify as FaAlignNone,
  FaArrowLeft,
  FaArrowRight,
  FaTimesCircle,
} from "react-icons/fa";
import ImageUploader from "../image-uploader";
import { extendedImage } from "@/lib/tiptapExtensions";
// import './styles.css'; // Если нужны будут специфичные стили для редактора

interface TiptapEditorProps {
  content: unknown; // Начальное содержимое (JSON или HTML)
  onChange: (content: unknown) => void; // Функция обратного вызова при изменении
  editable?: boolean;
}

const TiptapEditor: React.FC<TiptapEditorProps> = ({
  content,
  onChange,
  editable = true,
}) => {
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [isGalleryModalOpen, setIsGalleryModalOpen] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3, 4] },
      }),
      extendedImage,
      GalleryNode, // NEW
      TextAlign.configure({ types: ["heading", "paragraph", "image"] }),
      TextStyle,
      Color.configure({ types: ["textStyle"] }),
      Highlight.configure({ multicolor: true }),
      Link.configure({
        openOnClick: true,
        autolink: true,
        validate: (href) => /^https?:\/\//.test(href),
      }),
      Table.configure({ resizable: true }),
      TableRow,
      TableCell,
      TableHeader,
      CodeBlock.configure({
        languageClassPrefix: "language-",
      }),
    ],
    content: content as import("@tiptap/react").Content,
    editable: editable,
    immediatelyRender: false,
    onUpdate: ({ editor: currentEditor }) => {
      if (currentEditor) {
        onChange(currentEditor.getJSON());
      }
    },
    editorProps: {
      attributes: {
        class:
          "prose dark:prose-invert prose-sm sm:prose-base lg:prose-lg xl:prose-2xl m-5 focus:outline-none p-4 border border-gray-300 rounded-md min-h-[200px] tiptap-content-area",
      },
    },
  });

  const handleImageInsert = useCallback(
    (url: string | string[]) => {
      if (!editor) return;
      const djangoMediaUrl =
        process.env.NEXT_PUBLIC_DJANGO_MEDIA_URL || getBackendOrigin();
      if (Array.isArray(url)) {
        // Если массив, вставляем gallery node
        const images = url.map((src) => ({ src, alt: "" }));
        editor
          .chain()
          .focus()
          .insertContent({
            type: "gallery",
            attrs: { images },
          })
          .run();
      } else {
        // Обычная картинка
        const absoluteUrl =
          typeof url === "string" && url.startsWith("http")
            ? url
            : `${djangoMediaUrl}${url}`;
        editor
          .chain()
          .focus()
          .setImage({
            src: absoluteUrl,
            alt: "image",
          })
          .run();
      }
      setIsImageModalOpen(false);
      setIsGalleryModalOpen(false);
    },
    [editor],
  );

  const setImageAlignment = (align: string | null) => {
    if (!editor || !editor.isActive("image")) return;

    const currentAttributes = editor.getAttributes("image");
    let currentClasses = (currentAttributes.class || "tiptap-image")
      .split(" ")
      .filter(Boolean);

    const alignmentClasses = [
      "float-left",
      "float-right",
      "align-center",
      "mx-auto",
    ];
    currentClasses = currentClasses.filter(
      (cls: string) => !alignmentClasses.includes(cls),
    );

    if (align === "left") {
      currentClasses.push("float-left");
    } else if (align === "right") {
      currentClasses.push("float-right");
    } else if (align === "center") {
      currentClasses.push("mx-auto");
    }

    const newClassString = [...new Set(currentClasses)].join(" ").trim();

    editor
      .chain()
      .focus()
      .updateAttributes("image", { class: newClassString || "tiptap-image" })
      .run();
  };

  const isImageAlignActive = (align: string): boolean => {
    if (!editor || !editor.isActive("image")) return false;
    const currentClass = editor.getAttributes("image").class || "";
    const hasFloatLeft = currentClass.includes("float-left");
    const hasFloatRight = currentClass.includes("float-right");
    const hasAlignCenter = currentClass.includes("mx-auto");

    if (align === "left") return hasFloatLeft;
    if (align === "right") return hasFloatRight;
    if (align === "center") return hasAlignCenter;
    if (align === "none")
      return !hasFloatLeft && !hasFloatRight && !hasAlignCenter;
    return false;
  };

  const setLink = useCallback(() => {
    if (!editor) return;
    const previousUrl = editor.getAttributes("link").href;
    const url = window.prompt("URL", previousUrl);

    if (url === null) return; // Пользователь нажал "Отмена"
    if (url === "") {
      // Пользователь стер URL, значит, удаляем ссылку
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    // Устанавливаем или обновляем ссылку
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }, [editor]);

  if (!editor) {
    return null;
  }

  return (
    <div className="tiptap-container border rounded-md">
      <div className="toolbar flex flex-wrap items-center gap-1 p-2 border-b bg-gray-50 rounded-t-md">
        <MenuButton
          title="Bold"
          onClick={() => editor.chain().focus().toggleBold().run()}
          disabled={!editor.can().toggleBold()}
          isActive={editor.isActive("bold")}
        >
          <FaBold />
        </MenuButton>
        <MenuButton
          title="Italic"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          disabled={!editor.can().toggleItalic()}
          isActive={editor.isActive("italic")}
        >
          <FaItalic />
        </MenuButton>
        <MenuButton
          title="Strike"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          disabled={!editor.can().toggleStrike()}
          isActive={editor.isActive("strike")}
        >
          <FaStrikethrough />
        </MenuButton>
        <MenuButton
          title="Inline Code"
          onClick={() => editor.chain().focus().toggleCode().run()}
          disabled={!editor.can().toggleCode()}
          isActive={editor.isActive("code")}
        >
          <FaCode />
        </MenuButton>
        <MenuButton
          title="Highlight"
          onClick={() => editor.chain().focus().toggleHighlight().run()}
          isActive={editor.isActive("highlight")}
        >
          <FaHighlighter />
        </MenuButton>
        <MenuButton
          title="Set Link"
          onClick={setLink}
          isActive={editor.isActive("link")}
        >
          <FaLink />
        </MenuButton>
        <MenuButton
          title="Unset Link"
          onClick={() => editor.chain().focus().unsetLink().run()}
          disabled={!editor.isActive("link")}
        >
          <FaUnlink />
        </MenuButton>

        <div className="flex items-center p-1">
          <FaPalette className="mr-1" title="Text Color" />
          <input
            type="color"
            className="w-6 h-6 border-none cursor-pointer p-0 bg-transparent"
            onInput={(event) =>
              editor
                .chain()
                .focus()
                .setColor((event.target as HTMLInputElement).value)
                .run()
            }
            value={editor.getAttributes("textStyle").color || "#000000"}
            data-testid="setColor"
            title="Text Color"
          />
        </div>

        <div className="mx-1 h-5 border-l border-gray-300"></div>

        <MenuButton
          title="Paragraph"
          onClick={() => editor.chain().focus().setParagraph().run()}
          isActive={editor.isActive("paragraph")}
        >
          <FaParagraph />
        </MenuButton>
        {headingLevels.map((level) => (
          <MenuButton
            key={level as number | string}
            title={`Heading ${level}`}
            onClick={() =>
              editor
                .chain()
                .focus()
                .toggleHeading({ level: level as 1 | 2 | 3 | 4 | 5 | 6 })
                .run()
            }
            isActive={editor.isActive("heading", {
              level: level as 1 | 2 | 3 | 4 | 5 | 6,
            })}
          >
            <div className="flex items-center">
              <FaHeading />
              <span className="ml-1 text-xs">{String(level)}</span>
            </div>
          </MenuButton>
        ))}
        <MenuButton
          title="Bullet List"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          isActive={editor.isActive("bulletList")}
        >
          <FaListUl />
        </MenuButton>
        <MenuButton
          title="Ordered List"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          isActive={editor.isActive("orderedList")}
        >
          <FaListOl />
        </MenuButton>
        <MenuButton
          title="Code Block"
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          disabled={!editor.can().toggleCodeBlock()}
          isActive={editor.isActive("codeBlock")}
        >
          <FaFileCode />
        </MenuButton>
        <MenuButton
          title="Blockquote"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          isActive={editor.isActive("blockquote")}
        >
          <FaQuoteLeft />
        </MenuButton>
        <MenuButton
          title="Horizontal Rule"
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
        >
          <FaMinus />
        </MenuButton>

        <div className="mx-1 h-5 border-l border-gray-300"></div>

        <MenuButton
          title="Align Text Left"
          onClick={() => editor.chain().focus().setTextAlign("left").run()}
          isActive={editor.isActive({ textAlign: "left" })}
        >
          <FaAlignLeft />
        </MenuButton>
        <MenuButton
          title="Align Text Center"
          onClick={() => editor.chain().focus().setTextAlign("center").run()}
          isActive={editor.isActive({ textAlign: "center" })}
        >
          <FaAlignCenter />
        </MenuButton>
        <MenuButton
          title="Align Text Right"
          onClick={() => editor.chain().focus().setTextAlign("right").run()}
          isActive={editor.isActive({ textAlign: "right" })}
        >
          <FaAlignRight />
        </MenuButton>
        <MenuButton
          title="Align Text Justify"
          onClick={() => editor.chain().focus().setTextAlign("justify").run()}
          isActive={editor.isActive({ textAlign: "justify" })}
        >
          <FaAlignJustify />
        </MenuButton>

        <div className="mx-1 h-5 border-l border-gray-300"></div>

        <MenuButton title="Add Image" onClick={() => setIsImageModalOpen(true)}>
          <FaImage />
        </MenuButton>
        <MenuButton
          title="Float Left"
          onClick={() => setImageAlignment("left")}
          isActive={isImageAlignActive("left")}
          disabled={!editor.isActive("image")}
        >
          <FaArrowLeft />
        </MenuButton>
        <MenuButton
          title="Align Center"
          onClick={() => setImageAlignment("center")}
          isActive={isImageAlignActive("center")}
          disabled={!editor.isActive("image")}
        >
          <FaAlignCenter />
        </MenuButton>
        <MenuButton
          title="Float Right"
          onClick={() => setImageAlignment("right")}
          isActive={isImageAlignActive("right")}
          disabled={!editor.isActive("image")}
        >
          <FaArrowRight />
        </MenuButton>
        <MenuButton
          title="Clear Float/Align"
          onClick={() => setImageAlignment(null)}
          isActive={isImageAlignActive("none")}
          disabled={!editor.isActive("image")}
        >
          <FaAlignNone />
        </MenuButton>
        {/* Кнопка удаления изображения */}
        <MenuButton
          title="Удалить изображение"
          onClick={() => editor.chain().focus().deleteSelection().run()}
          disabled={!editor.isActive("image")}
        >
          <FaTimesCircle />
        </MenuButton>

        {editor.isActive("image") && (
          <div className="flex items-center ml-2 p-1">
            <label
              htmlFor="imgWidth"
              className="text-sm mr-1 whitespace-nowrap"
            >
              Ширина:
            </label>
            <input
              id="imgWidth"
              type="text"
              className="p-1 border rounded w-24 text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              defaultValue={
                editor.getAttributes("image").width === "auto"
                  ? ""
                  : editor.getAttributes("image").width || ""
              }
              placeholder="авто (напр. 50%)"
              onBlur={(e: React.FocusEvent<HTMLInputElement>) => {
                let newWidth = e.target.value.trim();
                if (newWidth === "" || newWidth === "auto") {
                  newWidth = "auto"; // Устанавливаем 'auto' если пусто или явно 'auto'
                }
                // Простая валидация: должно быть число + % или число + px, или auto
                if (
                  newWidth === "auto" ||
                  /^\d+(\.\d+)?(px|%)?$/.test(newWidth)
                ) {
                  editor
                    .chain()
                    .focus()
                    .updateAttributes("image", { width: newWidth })
                    .run();
                } else if (newWidth !== "auto" && newWidth !== "") {
                  // Если формат неверный и не пусто, можно вернуть предыдущее значение или сообщить об ошибке
                  // Пока просто не применяем некорректное значение, кроме 'auto'
                  (e.target as HTMLInputElement).value =
                    editor.getAttributes("image").width === "auto"
                      ? ""
                      : editor.getAttributes("image").width || "";
                }
              }}
              onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  (e.target as HTMLInputElement).blur(); // Вызываем onBlur для применения значения
                }
                if (e.key === "Escape") {
                  e.preventDefault();
                  (e.target as HTMLInputElement).value =
                    editor.getAttributes("image").width === "auto"
                      ? ""
                      : editor.getAttributes("image").width || "";
                  (e.target as HTMLInputElement).blur();
                }
              }}
            />
          </div>
        )}

        <div className="mx-1 h-5 border-l border-gray-300"></div>

        <MenuButton
          title="Undo"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
        >
          <FaUndo />
        </MenuButton>
        <MenuButton
          title="Redo"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
        >
          <FaRedo />
        </MenuButton>
      </div>

      <EditorContent
        editor={editor}
        className="prose prose-lg max-w-none tiptap-content p-3"
      />

      {/* Временная кнопка для вставки gallery node для теста */}
      {editor && (
        <button
          className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          onClick={() => {
            editor
              .chain()
              .focus()
              .insertContent({
                type: "gallery",
                attrs: {
                  images: [
                    {
                      src: "https://images.unsplash.com/photo-1506744038136-46273834b3fb",
                      alt: "Demo 1",
                    },
                    {
                      src: "https://images.unsplash.com/photo-1465101046530-73398c7f28ca",
                      alt: "Demo 2",
                    },
                    {
                      src: "https://images.unsplash.com/photo-1454023492550-5696f8ff10e1",
                      alt: "Demo 3",
                    },
                  ],
                },
              });
          }}
        >
          + Галерея (тест)
        </button>
      )}

      {/* Кнопки для вставки изображения и галереи */}
      <div className="flex gap-2 mt-4">
        <button
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          onClick={() => setIsImageModalOpen(true)}
        >
          + Картинка
        </button>
        <button
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          onClick={() => setIsGalleryModalOpen(true)}
        >
          + Галерея
        </button>
      </div>

      {/* Модалка для одиночной картинки */}
      {isImageModalOpen && (
        <div className="image-upload-modal fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-lg w-full">
            <h3 className="text-lg font-medium mb-4">
              Загрузить изображение для вставки
            </h3>
            <ImageUploader
              label="Выберите или перетащите файл"
              onUploadComplete={handleImageInsert}
              cropMode="content"
            />
            <button
              onClick={() => setIsImageModalOpen(false)}
              className="mt-4 px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 text-sm"
            >
              Отмена
            </button>
          </div>
        </div>
      )}

      {/* Модалка для галереи */}
      {isGalleryModalOpen && (
        <div className="image-upload-modal fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-lg w-full">
            <h3 className="text-lg font-medium mb-4">
              Загрузить изображения для галереи
            </h3>
            <ImageUploader
              label="Выберите или перетащите файлы"
              cropMode="content"
              onUploadComplete={(urls) => {
                if (!editor) return;
                let images: { src: string; alt: string }[] = [];
                const djangoMediaUrl =
                  process.env.NEXT_PUBLIC_DJANGO_MEDIA_URL ||
                  getBackendOrigin();
                if (Array.isArray(urls)) {
                  images = urls.map((src) => ({
                    src: src.startsWith("http")
                      ? src
                      : `${djangoMediaUrl}${src}`,
                    alt: "",
                  }));
                } else if (typeof urls === "string") {
                  images = [
                    {
                      src: urls.startsWith("http")
                        ? urls
                        : `${djangoMediaUrl}${urls}`,
                      alt: "",
                    },
                  ];
                }
                if (images.length === 1) {
                  // Вставляем как обычное изображение
                  editor
                    .chain()
                    .focus()
                    .setImage({ src: images[0].src, alt: "image" })
                    .run();
                } else if (images.length > 1) {
                  editor
                    .chain()
                    .focus()
                    .insertContent({
                      type: "gallery",
                      attrs: { images },
                    })
                    .run();
                }
                setIsGalleryModalOpen(false);
              }}
              cropMode="content"
              multiple={true}
            />
            <button
              onClick={() => setIsGalleryModalOpen(false)}
              className="mt-4 px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 text-sm"
            >
              Отмена
            </button>
          </div>
        </div>
      )}

      <style jsx global>{`
        /* Стили, специфичные для контента, будут перенесены в globals.css */
        /* Здесь могут остаться только стили, специфичные для UI самого редактора, не для контента */
        /* Например, если бы модальное окно image-upload-modal имело уникальные стили, не покрываемые Tailwind */
      `}</style>
    </div>
  );
};

const headingLevels: unknown[] = [1, 2, 3];

const MenuButton: React.FC<{
  onClick: () => void;
  disabled?: boolean;
  isActive?: boolean;
  title: string;
  children: React.ReactNode;
}> = ({ onClick, disabled, isActive, title, children }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    title={title}
    className={`p-2 rounded hover:bg-gray-200 ${
      isActive ? "bg-gray-200" : "bg-transparent"
    } disabled:opacity-50`}
  >
    {children}
  </button>
);

export default TiptapEditor;
