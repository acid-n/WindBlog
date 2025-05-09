import Image from "@tiptap/extension-image";

export const extendedImage = Image.configure({
  inline: true,
  allowBase64: true,
  HTMLAttributes: {
    class: "tiptap-image",
  },
}).extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      src: {
        default: null,
        parseHTML: (element: HTMLElement) => element.getAttribute("src"),
        renderHTML: (attributes: Record<string, any>) => ({
          src: attributes.src,
        }),
      },
      alt: {
        default: null,
        parseHTML: (element: HTMLElement) => element.getAttribute("alt"),
        renderHTML: (attributes: Record<string, any>) => ({
          alt: attributes.alt,
        }),
      },
      title: {
        default: null,
        parseHTML: (element: HTMLElement) => element.getAttribute("title"),
        renderHTML: (attributes: Record<string, any>) => ({
          title: attributes.title,
        }),
      },
      width: {
        default: "auto",
        parseHTML: (element: HTMLElement) =>
          element.getAttribute("width") || element.style.width,
        renderHTML: (attributes: Record<string, any>) => {
          if (!attributes.width || attributes.width === "auto") {
            return {};
          }
          return { style: `width: ${attributes.width}; height: auto;` };
        },
      },
      class: {
        default: "tiptap-image",
        parseHTML: (element: HTMLElement) => element.getAttribute("class"),
        renderHTML: (attributes: Record<string, any>) => {
          // Убедимся, что класс 'tiptap-image' всегда есть, если другие отсутствуют или только он
          const baseClass = "tiptap-image";
          let finalClasses = baseClass;
          if (attributes.class) {
            const allClasses = attributes.class.split(" ").filter(Boolean);
            if (!allClasses.includes(baseClass)) {
              allClasses.push(baseClass);
            }
            finalClasses = [...new Set(allClasses)].join(" "); // Удаляем дубликаты, если есть
          }
          return { class: finalClasses.trim() };
        },
      },
    };
  },
});
