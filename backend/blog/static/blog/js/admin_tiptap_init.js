// JavaScript for initializing Tiptap in Django admin for the 'body' field.

/**
 * Асинхронно загружает скрипт по URL.
 * @param {string} src URL скрипта.
 * @returns {Promise<void>}
 */
function loadScript(src) {
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.onload = () => {
      console.log(`Script loaded: ${src}`);
      resolve();
    };
    script.onerror = (error) => {
      console.error(`Script load error: ${src}`, error);
      reject(error);
    };
    document.head.appendChild(script);
  });
}

/**
 * Инициализирует редактор Tiptap.
 * @param {HTMLTextAreaElement} textarea Скрытый textarea с JSON.
 */
function initializeEditor(textarea) {
  // Проверяем, загружены ли глобальные объекты Tiptap
  if (
    typeof window.Tiptap?.Core?.Editor !== "function" ||
    typeof window.TiptapStarterKit?.StarterKit !== "function" ||
    typeof window.TiptapExtensionImage?.Image !== "function" ||
    typeof window.TiptapExtensionBlockquote?.Blockquote !== "function" ||
    typeof window.TiptapExtensionCodeBlock?.CodeBlock !== "function"
  ) {
    console.error(
      "Tiptap core or extensions not loaded correctly! Make sure all loadScript promises resolved.",
    );
    textarea.style.display = ""; // Показываем textarea обратно, если ошибка
    return;
  }

  // Получаем ссылку на Editor и расширения из глобального window
  const { Editor } = window.Tiptap.Core;
  const StarterKit = window.TiptapStarterKit.StarterKit;
  const Image = window.TiptapExtensionImage.Image;
  const Blockquote = window.TiptapExtensionBlockquote.Blockquote;
  const CodeBlock = window.TiptapExtensionCodeBlock.CodeBlockLowlight; // Используем с подсветкой

  // Нужны common и lowlight для CodeBlockLowlight
  const lowlight = window.lowlight;
  if (typeof lowlight === "undefined" && typeof window.hljs === "object") {
    // Попытка использовать hljs если lowlight не загрузился
    console.warn(
      "lowlight not found, attempting to use hljs directly for CodeBlockLowlight.",
    );
    // В реальности, для CodeBlockLowlight нужна именно lowlight
  } else if (typeof lowlight === "undefined") {
    console.error(
      "lowlight library (required for CodeBlockLowlight) not loaded!",
    );
    // Можно откатиться к обычному CodeBlock
    // CodeBlock = window.TiptapExtensionCodeBlock.CodeBlock;
  }

  // 1. Скрываем textarea (уже сделано ранее)

  // 2. Создаем div для редактора
  const editorDiv = document.createElement("div");
  editorDiv.id = "tiptap-editor-container";
  editorDiv.classList.add("tiptap-editor-wrapper"); // Добавим класс для стилизации
  // Вставляем div после textarea
  textarea.parentNode.insertBefore(editorDiv, textarea.nextSibling);

  // 3. Парсим начальное содержимое из textarea
  let initialContent = {};
  const rawContent = textarea.value.trim();
  try {
    if (rawContent) {
      initialContent = JSON.parse(rawContent);
    } else {
      initialContent = { type: "doc", content: [{ type: "paragraph" }] };
    }
  } catch (e) {
    console.error("Failed to parse initial JSON content from textarea:", e);
    console.error("Textarea content was:", rawContent);
    initialContent = { type: "doc", content: [{ type: "paragraph" }] }; // Fallback
    textarea.value = JSON.stringify(initialContent); // Запишем валидный JSON обратно
  }

  // 4. Инициализируем редактор Tiptap
  const editor = new Editor({
    element: editorDiv, // Куда монтировать
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        codeBlock: false, // Отключаем базовый, используем lowlight
        // history: true, // Включен по умолчанию
      }),
      Image.configure({
        // Пока без настройки загрузки
      }),
      Blockquote,
      CodeBlock.configure({ lowlight }), // Настраиваем с lowlight
      // Добавьте другие нужные расширения здесь
    ],
    content: initialContent, // Устанавливаем начальное содержимое

    // 5. Настраиваем синхронизацию при обновлении
    onUpdate: ({ editor }) => {
      const jsonContent = editor.getJSON();
      textarea.value = JSON.stringify(jsonContent, null, 2); // Сохраняем с форматированием для читаемости
    },
  });

  console.log("Tiptap editor instance created:", editor);
  // Добавляем в window для отладки
  window.tiptapAdminEditor = editor;
}

/**
 * Основная точка входа.
 */
async function main() {
  console.log("admin_tiptap_init.js executing...");

  const textarea = document.getElementById("id_body");
  if (!textarea) {
    console.error('Textarea with id="id_body" not found.');
    return;
  }
  console.log("Textarea found:", textarea);
  textarea.style.display = "none";

  try {
    // Загружаем локальные скрипты Tiptap и зависимости
    // Пути относительно STATIC_URL (обычно /static/)
    await loadScript("/static/blog/vendor/tiptap/tiptap-core.umd.js");
    await loadScript("/static/blog/vendor/tiptap/tiptap-starter-kit.umd.js");
    await loadScript(
      "/static/blog/vendor/tiptap/tiptap-extension-image.umd.js",
    );
    await loadScript(
      "/static/blog/vendor/tiptap/tiptap-extension-blockquote.umd.js",
    );
    // Для CodeBlockLowlight
    await loadScript("/static/blog/vendor/hljs/core.min.js");
    await loadScript("/static/blog/vendor/lowlight/common.min.js");
    await loadScript(
      "/static/blog/vendor/tiptap/tiptap-extension-code-block-lowlight.umd.js",
    );

    initializeEditor(textarea);
  } catch (error) {
    console.error("Error loading local Tiptap scripts:", error);
    textarea.style.display = "";
    const errorMsg = document.createElement("p");
    errorMsg.textContent =
      "Ошибка загрузки локального редактора Tiptap. Пожалуйста, проверьте консоль.";
    errorMsg.style.color = "red";
    textarea.parentNode.insertBefore(errorMsg, textarea.nextSibling);
  }
}

// Запускаем при загрузке DOM
document.addEventListener("DOMContentLoaded", main);
