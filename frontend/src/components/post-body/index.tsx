import React from "react";
import styles from "./styles.module.css";

/**
 * Компонент для рендеринга контента поста (StreamField-like JSON).
 */

// Определяем типы для данных каждого блока
interface TextBlockData {
  text: string;
}

interface HeadingBlockData {
  text: string;
}

interface ImageBlockData {
  url: string;
  alt?: string;
  float?: 'left' | 'right' | 'center';
}

interface QuoteBlockData {
  text: string;
}

interface CodeBlockData {
  code: string;
}

interface GalleryImage {
  url: string;
  alt?: string;
}

interface GalleryBlockData {
  images: GalleryImage[];
}

interface VideoBlockData {
  url: string;
  title?: string;
}

interface LinkBlockData {
  url: string;
  text?: string;
}

// Определяем интерфейс для каждого типа блока с конкретным типом данных
interface TextBlock {
  type: 'text';
  data: TextBlockData;
}

interface HeadingBlock {
  type: 'heading';
  data: HeadingBlockData;
}

interface ImageBlock {
  type: 'image';
  data: ImageBlockData;
}

interface QuoteBlock {
  type: 'quote';
  data: QuoteBlockData;
}

interface CodeBlock {
  type: 'code';
  data: CodeBlockData;
}

interface GalleryBlock {
  type: 'gallery';
  data: GalleryBlockData;
}

interface VideoBlock {
  type: 'video';
  data: VideoBlockData;
}

interface LinkBlock {
  type: 'link';
  data: LinkBlockData;
}

// Объединение всех возможных типов блоков
type AnyBlock =
  | TextBlock
  | HeadingBlock
  | ImageBlock
  | QuoteBlock
  | CodeBlock
  | GalleryBlock
  | VideoBlock
  | LinkBlock;

interface PostBodyProps {
  body: { blocks: AnyBlock[] };
}

const PostBody: React.FC<PostBodyProps> = ({ body }) => {
  if (!body?.blocks?.length) return null;
  
  return (
    <div className="prose prose-lg max-w-none">
      {body.blocks.map((block, i) => {
        switch (block.type) {
          case "text":
            return (
              <p key={i} dangerouslySetInnerHTML={{ __html: block.data.text.replace(/\n/g, '<br/>') }} />
            );
            
          case "heading":
            return <h2 key={i} className="text-[#333] text-[1.6em] font-bold mt-8 mb-4">{block.data.text}</h2>;
            
          case "image": {
            const float = block.data.float;
            let floatClass = "";
            
            if (float === "left") {
              floatClass = styles.imageLeft;
            } else if (float === "right") {
              floatClass = styles.imageRight;
            } else {
              floatClass = styles.imageCenter;
            }
            
            return (
              <img
                key={i}
                src={block.data.url}
                alt={block.data.alt || ""}
                className={`rounded shadow ${floatClass}`}
                loading="lazy"
              />
            );
          }
            
          case "quote":
            return (
              <blockquote key={i} className={styles.blockquote}>
                {block.data.text}
              </blockquote>
            );
            
          case "code":
            return (
              <pre key={i} className="bg-gray-100 rounded p-4 overflow-x-auto my-6 text-sm">
                <code>{block.data.code}</code>
              </pre>
            );
            
          case "gallery":
            return (
              <div key={i} className="flex flex-wrap gap-2 my-6">
                {block.data.images.map((img, idx: number) => (
                  <div key={idx} className="w-1/3 p-1">
                    <img
                      src={img.url}
                      alt={img.alt || ""}
                      className="w-full h-auto rounded shadow"
                      loading="lazy"
                    />
                  </div>
                ))}
              </div>
            );
            
          case "video":
            return (
              <div key={i} className="my-6 aspect-video relative">
                <iframe
                  src={block.data.url}
                  title={block.data.title || "Видео"}
                  className="w-full h-full rounded"
                  allowFullScreen
                />
              </div>
            );
            
          case "link":
            return (
              <a
                key={i}
                href={block.data.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#CE6607] hover:text-[#A35208] underline"
              >
                {block.data.text || block.data.url}
              </a>
            );
            
          default:
            // Можно добавить обработку для неизвестных типов блоков или просто null
            // console.warn("Unknown block type:", block.type);
            return null;
        }
      })}
    </div>
  );
};

export default PostBody;
