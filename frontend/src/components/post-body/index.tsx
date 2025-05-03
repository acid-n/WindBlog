import React from "react";

/**
 * Компонент для рендеринга контента поста (StreamField-like JSON).
 */
interface Block {
  type: string;
  data: any;
}

interface PostBodyProps {
  body: { blocks: Block[] };
}

const PostBody: React.FC<PostBodyProps> = ({ body }) => {
  if (!body?.blocks?.length) return null;
  return (
    <div className="prose prose-lg max-w-none text-gray-800">
      {body.blocks.map((block, i) => {
        switch (block.type) {
          case "text":
            return <p key={i}>{block.data.text}</p>;
          case "heading":
            return <h2 key={i}>{block.data.text}</h2>;
          case "image":
            return (
              <img
                key={i}
                src={block.data.url}
                alt={block.data.alt || ""}
                className="my-4 rounded shadow"
                loading="lazy"
              />
            );
          case "quote":
            return <blockquote key={i}>{block.data.text}</blockquote>;
          case "code":
            return (
              <pre key={i} className="bg-gray-100 rounded p-4 overflow-x-auto">
                <code>{block.data.code}</code>
              </pre>
            );
          case "gallery":
            return (
              <div key={i} className="flex flex-wrap gap-2 my-4">
                {block.data.images.map((img: any, idx: number) => (
                  <img
                    key={idx}
                    src={img.url}
                    alt={img.alt || ""}
                    className="w-1/3 rounded"
                    loading="lazy"
                  />
                ))}
              </div>
            );
          case "video":
            return (
              <div key={i} className="my-4">
                <iframe
                  src={block.data.url}
                  title={block.data.title || "Видео"}
                  className="w-full aspect-video rounded"
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
                className="text-blue-600 underline hover:text-blue-800"
              >
                {block.data.text || block.data.url}
              </a>
            );
          default:
            return null;
        }
      })}
    </div>
  );
};

export default PostBody;
