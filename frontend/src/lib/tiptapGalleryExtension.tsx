import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import React from 'react';
import TiptapGallery, { GalleryImage } from '@/components/tiptap-gallery';

export interface GalleryNodeAttrs {
  images: GalleryImage[];
}

export const GalleryNode = Node.create({
  name: 'gallery',
  group: 'block',
  atom: true,
  selectable: true,
  draggable: true,
  addAttributes() {
    return {
      images: {
        default: [],
        parseHTML: el => {
          const imgs = el.querySelectorAll('img');
          return Array.from(imgs).map(img => ({
            src: img.getAttribute('src') || '',
            alt: img.getAttribute('alt') || '',
            title: img.getAttribute('title') || '',
          }));
        },
        renderHTML: attrs => ({
          'data-images': JSON.stringify(attrs.images),
        }),
      },
      loop: {
        default: false,
        parseHTML: el => el.getAttribute('data-loop') === 'true',
        renderHTML: attrs => ({ 'data-loop': String(attrs.loop) }),
      },
      autoplay: {
        default: false,
        parseHTML: el => el.getAttribute('data-autoplay') === 'true',
        renderHTML: attrs => ({ 'data-autoplay': String(attrs.autoplay) }),
      },
      autoplayDelay: {
        default: 3500,
        parseHTML: el => {
          const d = el.getAttribute('data-autoplay-delay');
          return d ? parseInt(d, 10) : 3500;
        },
        renderHTML: attrs => ({ 'data-autoplay-delay': String(attrs.autoplayDelay) }),
      },
      galleryHeight: {
        default: 320,
        parseHTML: el => {
          const h = el.getAttribute('data-gallery-height');
          return h ? parseInt(h, 10) : 320;
        },
        renderHTML: attrs => ({ 'data-gallery-height': String(attrs.galleryHeight) }),
      },
    };
  },
  parseHTML() {
    return [
      {
        tag: 'div[data-type="gallery"]',
      },
    ];
  },
  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, { 'data-type': 'gallery' }),
      // В HTML будет просто контейнер, сами картинки не рендерим (SSR)
    ];
  },
  addNodeView() {
    // Используем ReactNodeViewRenderer для корректной интеграции React-компонента
    // https://tiptap.dev/docs/editor/guide/custom-extensions/react
    // TiptapGallery должен принимать props node, updateAttributes, view, getPos (если нужно редактирование)
    // Для базового отображения достаточно просто ReactNodeViewRenderer(TiptapGallery)
    // Если потребуется больше props, можно расширить компонент
    // Важно: ReactNodeViewRenderer импортируется из @tiptap/react
    //
    // import { ReactNodeViewRenderer } from '@tiptap/react';
    return ReactNodeViewRenderer(TiptapGallery);
  },
});
