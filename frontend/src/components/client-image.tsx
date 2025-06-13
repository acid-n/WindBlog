"use client";

import React from "react";
import Image, { ImageProps } from "next/image";
import { getClientMediaUrl } from "@/utils/media";

interface ClientImageProps extends Omit<ImageProps, "src"> {
  src: string | undefined;
  alt: string;
}

/**
 * Компонент для рендера изображений с абсолютным URL на клиенте.
 * Принимает относительный путь (например, /media/...) и формирует полный URL через NEXT_PUBLIC_DJANGO_MEDIA_URL.
 */
const ClientImage: React.FC<ClientImageProps> = ({ src, alt, ...rest }) => {
  if (!src) return null;
  let finalSrc = getClientMediaUrl(src);
  // Если путь не абсолютный (не начинается с http), показываем fallback
  if (!/^https?:\/\//.test(finalSrc)) {
    console.warn('[ClientImage] Некорректный src для next/image:', finalSrc);
    return <img src={src} alt={alt} {...rest} style={{ border: '2px solid red' }} />;
  }
  return <Image src={finalSrc} alt={alt} {...rest} />;
};

export default ClientImage;
