import React, { useState } from "react";
import { NodeViewProps, NodeViewWrapper } from "@tiptap/react";
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/thumbs';
import { Navigation, Pagination, Thumbs, Autoplay } from 'swiper/modules';
import ImageUploader from '../image-uploader';

export interface GalleryImage {
  src: string;
  alt?: string;
}

const TiptapGallery: React.FC<NodeViewProps> = (props) => {
  const images = props.node.attrs.images || [];
  const editable = props.editor.isEditable;
  const [thumbsSwiper, setThumbsSwiper] = useState<any>(null);
  const mainSwiperRef = React.useRef<any>(null);

  // Gallery settings (from attrs or defaults)
  const loop = props.node.attrs.loop ?? false;
  const autoplay = props.node.attrs.autoplay ?? false;
  const [autoplayDelay, setAutoplayDelay] = useState(props.node.attrs.autoplayDelay ?? 3500);
  React.useEffect(() => {
    setAutoplayDelay(props.node.attrs.autoplayDelay ?? 3500);
  }, [props.node.attrs.autoplayDelay]);
  // Новый параметр — aspectRatio (по умолчанию 16/9)
  const aspectRatio = props.node.attrs.aspectRatio ?? '16/9';
  // galleryHeight больше не нужен для пропорций
  const [showUploader, setShowUploader] = useState(false);

  // Settings handlers
  const handleToggleLoop = () => {
    props.updateAttributes({ ...props.node.attrs, loop: !loop });
  };
  const handleToggleAutoplay = () => {
    props.updateAttributes({ ...props.node.attrs, autoplay: !autoplay });
  };
  const handleAutoplayDelayChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = Number(e.target.value);
    setAutoplayDelay(value);
    props.updateAttributes({ ...props.node.attrs, autoplayDelay: value });
    console.log('Autoplay delay changed:', value);
  };

  React.useEffect(() => {
    console.log('Current autoplayDelay:', autoplayDelay);
  }, [autoplayDelay]);


  // Приведение src к корректному виду
  const normalizeSrc = (src: string) => {
    if (/^https?:\/\//.test(src)) return src;
    if (src.startsWith('/media/')) return src;
    // Если путь без /media/, добавить его
    return '/media/' + src.replace(/^\/?posts\//, 'posts/');
  };

  const handleAddImages = (urls: string | string[]) => {
    let newImages = [...images];
    if (Array.isArray(urls)) {
      // Если элементы уже объекты {src, alt} — не преобразовывать
      if (typeof urls[0] === 'object' && urls[0] !== null && 'src' in urls[0]) {
        const arr = urls as unknown as { src: string; alt?: string }[];
        newImages = newImages.concat(arr.map(img => ({
          ...img,
          src: normalizeSrc(img.src),
        })));
      } else {
        newImages = newImages.concat((urls as string[]).map((src) => ({ src: normalizeSrc(src), alt: '' })));
      }
    } else if (typeof urls === 'object' && urls !== null && 'src' in urls) {
      const img = urls as {src: string, alt?: string};
      newImages.push({ ...img, src: normalizeSrc(img.src) });
    } else {
      newImages.push({ src: normalizeSrc(urls as string), alt: '' });
    }
    props.updateAttributes({ ...props.node.attrs, images: newImages });
    setShowUploader(false);
  };

  const handleRemove = (idx: number) => {
    const next = images.slice();
    next.splice(idx, 1);
    props.updateAttributes({ ...props.node.attrs, images: next });
  };

  return (
    <NodeViewWrapper className="relative group w-full" style={{ width: '100%', padding: 0, margin: 0, background: 'none' }}>
      {/* Кнопка удаления галереи */}
      {editable && (
        <button
          aria-label="Удалить галерею"
          onClick={() => {
            if (window.confirm('Удалить галерею?')) {
              props.editor?.commands.command(({ tr, dispatch }) => {
                dispatch?.(tr.deleteSelection());
                return true;
              });
            }
          }}
          className="absolute top-2 right-2 z-20 p-2 bg-white rounded-full shadow hover:bg-red-100 group"
          style={{ border: '1px solid #eee', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 7h12M9 7V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3m2 0v12a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V7h12zm-7 4v6m4-6v6" />
          </svg>
        </button>
      )}
      {/* Панель управления только если editable */}
      {editable && (
        <>
          <div className="flex flex-row gap-4 items-center mb-3 bg-gray-100 rounded px-3 py-2">
            <button
              className="px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-xs"
              onClick={() => setShowUploader(true)}
              type="button"
            >
              + Добавить изображения
            </button>
            <label className="flex items-center gap-1 text-xs cursor-pointer">
              <input type="checkbox" checked={!!loop} onChange={handleToggleLoop} /> Зацикливать
            </label>
            <label className="flex items-center gap-1 text-xs cursor-pointer">
              <input type="checkbox" checked={!!autoplay} onChange={handleToggleAutoplay} /> Автолистание
              {autoplay && (
                <select
                  className="ml-2 border rounded px-1 py-0.5 text-xs"
                  value={autoplayDelay}
                  onChange={handleAutoplayDelayChange}
                >
                  <option value={1500}>1.5 сек</option>
                  <option value={2500}>2.5 сек</option>
                  <option value={3500}>3.5 сек</option>
                  <option value={5000}>5 сек</option>
                  <option value={8000}>8 сек</option>
                </select>
              )}
            </label>

          </div>
          {showUploader && (
            <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
              <div className="bg-white p-6 rounded shadow-xl max-w-lg w-full relative">
                <h3 className="text-lg font-medium mb-4">Добавить изображения в галерею</h3>
                <ImageUploader
                  label="Выберите или перетащите файлы"
                  multiple={true}
                  cropMode="content"
                  onUploadComplete={handleAddImages}
                />
                <button
                  onClick={() => setShowUploader(false)}
                  className="mt-4 px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 text-sm"
                >
                  Отмена
                </button>
              </div>
            </div>
          )}
          <div className="flex flex-row gap-2 flex-wrap">
            {images.map((img: any, idx: number) => (
              <div key={idx} className="relative group">
                <img
                  src={img.src}
                  alt={img.alt || `image-${idx}`}
                  className="w-24 h-24 object-cover rounded shadow"
                />
                <button
                  className="absolute top-1 right-1 bg-white bg-opacity-80 rounded-full p-1 text-xs shadow hover:bg-red-100"
                  onClick={() => handleRemove(idx)}
                  title="Удалить"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </>
      )}
      {/* Swiper всегда рендерится */}
      <div style={{ position: 'relative', width: '100%', marginTop: 16 }}>
        <div style={{ width: '100%', margin: 0, background: 'none', borderRadius: 0, boxShadow: 'none', position: 'relative', minHeight: 0, transition: 'none', overflow: 'visible', marginBottom: 8 }}>
        {/* Swiper main */}
        <Swiper
          modules={[Navigation, Pagination, Thumbs, Autoplay]}
          onSwiper={swiper => (mainSwiperRef.current = swiper)}
          thumbs={{ swiper: thumbsSwiper && !thumbsSwiper.destroyed ? thumbsSwiper : null }}
          navigation
          pagination={{ clickable: true }}
          loop={loop}
          autoplay={autoplay ? { delay: autoplayDelay, disableOnInteraction: false } : false}
          style={{ width: '100%', borderRadius: 0, background: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          className="gallery-main-swiper"
        >
          {images.map((img: any, idx: number) => (
            <SwiperSlide key={idx}>
              <div
                className="gallery-slide-img-wrapper"
                style={{
                  width: '100%',
                  background: '#f7f7f7',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'visible',
                  borderRadius: 12,
                }}
              >
                <img
                  src={img.src}
                  alt={img.alt || `image-${idx}`}
                  style={{ width: 'auto', height: '100%', maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', display: 'block' }}
                />
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
        </div>
        {/* Кастомные стрелки */}
        <button
          aria-label="Назад"
          style={{ position: 'absolute', top: '50%', left: 8, zIndex: 10, transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.25)', borderRadius: '50%', border: '1px solid #ccc', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.12)', backdropFilter: 'blur(2px)' }}
          onClick={() => mainSwiperRef.current?.slidePrev()}
          className="gallery-arrow gallery-arrow-prev hover:bg-blue-100"
        >
          <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M15 19l-7-7 7-7"/></svg>
        </button>
        <button
          aria-label="Вперёд"
          style={{ position: 'absolute', top: '50%', right: 8, zIndex: 10, transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.25)', borderRadius: '50%', border: '1px solid #ccc', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.12)', backdropFilter: 'blur(2px)' }}
          onClick={() => mainSwiperRef.current?.slideNext()}
          className="gallery-arrow gallery-arrow-next hover:bg-blue-100"
        >
          <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7"/></svg>
        </button>
        {/* Миниатюры поверх слайдера */}
        <div style={{ position: 'absolute', left: 0, right: 0, bottom: 12, zIndex: 11, display: 'flex', justifyContent: 'center', pointerEvents: 'none' }}>
          <div style={{ background: 'rgba(255,255,255,0.0)', borderRadius: 8, padding: 0, display: 'flex', boxShadow: 'none' }}>
            <Swiper
              modules={[Thumbs]}
              onSwiper={setThumbsSwiper}
              slidesPerView={Math.min(images.length, 7)}
              spaceBetween={0}
              watchSlidesProgress
              style={{ height: '44px', minWidth: 'auto', maxWidth: '420px', width: '100%' }}
              className="gallery-thumbs"
            >
              {images.map((img: any, idx: number) => (
                <SwiperSlide key={idx} style={{ margin: 0, padding: 0 }}>
                  <img
                    src={img.src}
                    alt={img.alt || `thumb-${idx}`}
                    className="object-cover rounded border-2 border-transparent hover:border-blue-400 cursor-pointer"
                    style={{ height: '40px', width: '50px', objectFit: 'cover', aspectRatio: 'auto', margin: 0, padding: 0, pointerEvents: 'all' }}
                  />
                  {/*
                    // Для локальной разработки: если src начинается с http://localhost:8000, можно выводить предупреждение или обрабатывать src для относительного пути
                    // Например: img.src.replace('http://localhost:8000', '')
                  */}
                </SwiperSlide>
              ))}
            </Swiper>
          </div>
        </div>
      </div>

      {/* Если нет изображений */}
      {(!images || images.length === 0) && (
        <div className="text-gray-400 text-sm italic mt-2">Нет изображений</div>
      )}
    </NodeViewWrapper>
  );
};

export default TiptapGallery;
