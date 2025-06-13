import { getClientMediaUrl } from '@/utils/media';

// Универсальная функция для рекурсивной обработки src у изображений в JSON Tiptap
export function processImageUrlsInJson(node: any): any {
  if (Array.isArray(node)) {
    return node.map((item) => processImageUrlsInJson(item));
  }
  if (
    typeof node === "object" &&
    node !== null &&
    "type" in node &&
    (node as any).type === "image" &&
    "attrs" in node &&
    (node as any).attrs &&
    (node as any).attrs.src
  ) {
    const newNode = { ...node };
    newNode.attrs = { ...newNode.attrs, src: getClientMediaUrl(newNode.attrs.src) };
    if ((node as any).content) {
      newNode.content = processImageUrlsInJson((node as any).content);
    }
    return newNode;
  }
  if (typeof node === "object" && node !== null) {
    // Обрабатываем вложенные объекты
    const newNode: any = { ...node };
    if (newNode.content) {
      newNode.content = processImageUrlsInJson(newNode.content);
    }
    return newNode;
  }
  return node;
}
