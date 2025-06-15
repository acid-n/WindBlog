"use client";

import React, { useState, useRef } from "react";
import { fetchWithAuth } from "@/services/apiClient"; // Для отправки файла
import Image from "next/image"; // Для превью
import {
  FaUpload,
  FaTimesCircle,
  FaSpinner,
} from "react-icons/fa"; // Иконки

export type CropMode = "content" | "preview";

interface ImageUploaderProps {
  label?: string; // Заголовок для поля загрузки
  onUploadComplete: (url: string | string[]) => void; // Колбэк при успешном подтверждении WEBP (один или несколько url)
  initialImageUrl?: string | null; // URL для отображения существующего изображения
  uploadFieldName?: string; // Имя поля для файла в POST запросе (по умолчанию 'upload')
  apiEndpoint?: string; // Эндпоинт для загрузки (по умолчанию '/api/v1/image-upload/')
  cropMode?: CropMode; // preview (default) | content
  multiple?: boolean; // Новый проп: можно выбрать несколько файлов
}

const ImageUploader: React.FC<ImageUploaderProps> = ({
  label = "Загрузить изображение",
  onUploadComplete,
  initialImageUrl = null,
  uploadFieldName = "upload",
  apiEndpoint = "/api/v1/image-upload/",
  cropMode = "preview",
  multiple = false,
}) => {
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [originalPreview, setOriginalPreview] = useState<string | null>(null);
  const [webpUrl, setWebpUrl] = useState<string | null>(initialImageUrl);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConverting, setIsConverting] = useState(false);
  const [convertedWebpFile, setConvertedWebpFile] = useState<File | null>(null);
  const [convertedWebpPreview, setConvertedWebpPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const djangoApiUrl =
    process.env.NEXT_PUBLIC_DJANGO_API_URL || "http://localhost:8000";
  const fullApiEndpoint = new URL(apiEndpoint, djangoApiUrl).toString();

  // Полный URL для отображения WEBP превью
  const djangoMediaBase = process.env.NEXT_PUBLIC_DJANGO_MEDIA_URL;
  let fullWebpPreviewUrl: string | null = null;

  // --- Множественная загрузка файлов ---
  const handleMultiFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    setIsLoading(true);
    setIsConverting(true);
    setError(null);
    const uploadedUrls: string[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const webpFile = await convertToWebPWithCropMode(file, cropMode);
        if (!webpFile) throw new Error("Ошибка конвертации файла " + file.name);
        // Загружаем webpFile
        const formData = new FormData();
        formData.append(uploadFieldName, webpFile);
        const response = await fetchWithAuth(fullApiEndpoint, {
          method: "POST",
          body: formData,
        });
        if (!response.ok) {
          let errorText = await response.text();
          throw new Error(`Ошибка загрузки файла ${file.name} (status ${response.status}): ${errorText}`);
        }
        const data = await response.json();
        uploadedUrls.push(data.url || data.image || "");
      } catch (err) {
        setError("Ошибка загрузки одного из файлов: " + (err instanceof Error ? err.message : String(err)));
      }
    }
    setIsLoading(false);
    setIsConverting(false);
    if (uploadedUrls.length > 0) {
      onUploadComplete(uploadedUrls);
    }
    // Сбросить value input, чтобы повторно можно было выбрать те же файлы
    if (fileInputRef.current) fileInputRef.current.value = "";
  };


  let currentRelativeWebpPath: string = "";
  if (webpUrl) {
    // webpUrl здесь это effectively initialImageUrl при первом рендере или измененное состояние
    let pathForProcessing = webpUrl;

    // 1. Если webpUrl начинается с djangoMediaBase, отрезаем его
    if (djangoMediaBase && pathForProcessing.startsWith(djangoMediaBase)) {
      pathForProcessing = pathForProcessing.substring(djangoMediaBase.length);
    }
    // 2. Если после этого (или вместо этого) он все еще выглядит как полный URL, пытаемся извлечь pathname
    else if (
      pathForProcessing.startsWith("http://") ||
      pathForProcessing.startsWith("https://")
    ) {
      try {
        const urlObject = new URL(pathForProcessing);
        pathForProcessing = urlObject.pathname;
        // Если pathname начинался с /media/, удаляем и это
        if (pathForProcessing.startsWith("/media/")) {
          pathForProcessing = pathForProcessing.substring("/media/".length);
        }
      } catch {
        // Ошибка парсинга URL
        console.error(
          `[ImageUploader ERROR] Не удалось распарсить как URL, хотя начинался с http: ${pathForProcessing}`
        );
        pathForProcessing = ""; // Считаем путь невалидным
      }
    }
    // 3. Если он не начинался с http, но начинается с /media/, отрезаем /media/
    else if (pathForProcessing.startsWith("/media/")) {
      pathForProcessing = pathForProcessing.substring("/media/".length);
    }

    // 4. Удаляем возможный начальный слэш, если остался после всех манипуляций
    if (pathForProcessing) {
      currentRelativeWebpPath = pathForProcessing.startsWith("/")
        ? pathForProcessing.substring(1)
        : pathForProcessing;
    }

    // 5. Финальная проверка на "мусор" (наличие http в относительном пути)
    if (
      currentRelativeWebpPath &&
      (currentRelativeWebpPath.includes("http://") ||
        currentRelativeWebpPath.includes("https://"))
    ) {
      console.error(
        `[ImageUploader ERROR] Получен некорректный относительный путь ПОСЛЕ ВСЕХ очисток: ${currentRelativeWebpPath}. Исходный webpUrl: ${webpUrl}`,
      );
      currentRelativeWebpPath = ""; // Сбрасываем, если он все еще содержит полный URL
    }
  }

  // --- КОНЕЦ ОТЛАДКИ ---

  if (currentRelativeWebpPath && djangoMediaBase) {
    // Строим URL только если есть оба компонента и currentRelativeWebpPath не null
    try {
      let base = djangoMediaBase;
      if (!base.endsWith("/")) {
        base += "/";
      }
      const tempUrlChecker = new URL(base);
      if (
        tempUrlChecker.protocol !== "http:" &&
        tempUrlChecker.protocol !== "https:"
      ) {
        throw new Error(
          "NEXT_PUBLIC_DJANGO_MEDIA_URL должен быть абсолютным URL.",
        );
      }
      // currentRelativeWebpPath уже должен быть очищен от начальных слэшей
      fullWebpPreviewUrl = new URL(currentRelativeWebpPath, base).toString();
    } catch {
      console.error(
        `[ImageUploader ERROR] Ошибка при формировании fullWebpPreviewUrl из djangoMediaBase ('${djangoMediaBase}') и currentRelativeWebpPath ('${currentRelativeWebpPath}').`,
      );
      fullWebpPreviewUrl = "";
    }
  } else if (currentRelativeWebpPath) {
    // Запасной вариант, если NEXT_PUBLIC_DJANGO_MEDIA_URL не установлен, но есть относительный путь
    console.warn(
      "[ImageUploader WARN] NEXT_PUBLIC_DJANGO_MEDIA_URL не установлен. Попытка отобразить превью по относительному пути /media/.",
    );
    fullWebpPreviewUrl = `/media/${currentRelativeWebpPath}`;
  }

  // --- КОНЕЦ ОТЛАДКИ ---

  // Универсальная функция конвертации в WEBP с/без кропа
  const convertToWebPWithCropMode = async (file: File, cropMode: CropMode): Promise<File | null> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new window.Image();
        img.onload = function () {
          const WEBP_QUALITY = 0.85;
          let canvas, ctx, newWidth, newHeight;
          if (cropMode === "preview") {
            // Кроп под 3:1
            const TARGET_ASPECT_RATIO = 3 / 1;
            const TARGET_WIDTH = 1200;
            const TARGET_HEIGHT = Math.round(TARGET_WIDTH / TARGET_ASPECT_RATIO);
            let sourceX = 0, sourceY = 0, sourceWidth = img.width, sourceHeight = img.height;
            const inputAspect = img.width / img.height;
            if (inputAspect > TARGET_ASPECT_RATIO) {
              sourceWidth = Math.round(img.height * TARGET_ASPECT_RATIO);
              sourceX = Math.round((img.width - sourceWidth) / 2);
            } else if (inputAspect < TARGET_ASPECT_RATIO) {
              sourceHeight = Math.round(img.width / TARGET_ASPECT_RATIO);
              sourceY = Math.round((img.height - sourceHeight) / 2);
            }
            canvas = document.createElement("canvas");
            canvas.width = TARGET_WIDTH;
            canvas.height = TARGET_HEIGHT;
            ctx = canvas.getContext("2d");
            if (!ctx) return reject(new Error("Не удалось получить 2D контекст канваса."));
            ctx.drawImage(
              img,
              sourceX,
              sourceY,
              sourceWidth,
              sourceHeight,
              0,
              0,
              TARGET_WIDTH,
              TARGET_HEIGHT,
            );
          } else {
            // content: только ресайз по ширине, без кропа
            const MAX_WIDTH = 1200;
            if (img.width > MAX_WIDTH) {
              newWidth = MAX_WIDTH;
              newHeight = Math.round((img.height / img.width) * newWidth);
            } else {
              newWidth = img.width;
              newHeight = img.height;
            }
            canvas = document.createElement("canvas");
            canvas.width = newWidth;
            canvas.height = newHeight;
            ctx = canvas.getContext("2d");
            if (!ctx) return reject(new Error("Не удалось получить 2D контекст канваса."));
            ctx.drawImage(img, 0, 0, newWidth, newHeight);
          }
          canvas.toBlob(
            (blob) => {
              if (blob) {
                const webpFileName =
                  (file.name.split(".").slice(0, -1).join(".") || file.name) +
                  ".webp";
                const newWebpFile = new File([blob], webpFileName, {
                  type: "image/webp",
                });
                resolve(newWebpFile);
              } else {
                reject(new Error("Не удалось создать Blob из канваса."));
              }
            },
            "image/webp",
            WEBP_QUALITY,
          );
        };
        img.onerror = function () {
          reject(new Error("Не удалось загрузить изображение в элемент img."));
        };
        if (event.target?.result && typeof event.target.result === "string") {
          img.src = event.target.result;
        } else {
          reject(new Error("Результат FileReader не является строкой или отсутствует."));
        }
      };
      reader.onerror = () => reject(new Error("Ошибка чтения файла"));
      reader.readAsDataURL(file);
    });
  };


  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const file = event.target.files[0];
      setOriginalFile(file);
      setOriginalPreview(URL.createObjectURL(file));
      setIsConverting(true);
      try {
        const convertedWebpFile = await convertToWebPWithCropMode(file, cropMode);
        if (convertedWebpFile) {
          setConvertedWebpFile(convertedWebpFile);
          setConvertedWebpPreview(URL.createObjectURL(convertedWebpFile));
        }
      } catch (error) {
        console.error("Ошибка конвертации в WEBP:", error);
        setError("Ошибка конвертации в WEBP.");
      } finally {
        setIsConverting(false);
      }
    }
  };


  const handleUploadConvertedWebP = async () => {
    // Переименовали функцию
    if (!convertedWebpFile) {
      setError("Нет WEBP файла для загрузки.");
      return;
    }

    setIsLoading(true);
    setError("");

    const formData = new FormData();
    formData.append(uploadFieldName, convertedWebpFile, convertedWebpFile.name);


    try {
      const response = await fetchWithAuth(fullApiEndpoint, {
        method: "POST",
        body: formData,
      });

      const contentType = response.headers.get("content-type");

      if (!response.ok) {
        let errorMessage = `Ошибка сервера: ${response.status}`;
        if (contentType && contentType.includes("application/json")) {
          try {
            const errorResult = await response.json();
            errorMessage =
              errorResult.message ||
              errorResult.error ||
              errorResult.detail ||
              JSON.stringify(errorResult);
          } catch {
            errorMessage = `Ошибка сервера: ${response.status}. Не удалось декодировать JSON с ошибкой.`;
          }
        }
        else {
          errorMessage = `Сервер вернул неожиданный ответ (не JSON). Статус: ${response.status}`;
        }
        throw new Error(errorMessage);
      }

      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Ответ от сервера не в формате JSON, хотя ожидался.");
      }

      const result = await response.json();

      if (!result.url) {
        throw new Error(
          'API не вернул URL для загруженного WEBP изображения в свойстве "url".',
        );
      }

      setWebpUrl(result.url);

      onUploadComplete(result.url as string); // result.url должен быть строкой, уточните тип если нужно

      // После успешной загрузки и вызова onUploadComplete, можно сбросить локальные файлы, если нужно
      // setOriginalFile(null);
    } catch (err: unknown) {
      console.error("Ошибка загрузки WEBP:", err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Произошла неизвестная ошибка при загрузке WEBP.");
      }
      setWebpUrl(null); // Сбрасываем URL от сервера в случае ошибки загрузки
    } finally {
      setIsLoading(false);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
  };

  return (
    <div className="image-uploader border border-gray-300 rounded-md p-4 space-y-4 bg-white">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}

      {/* 1. Блок выбора файла */}
      <div className="flex items-center space-x-4 mb-4">
        <button
          type="button"
          onClick={triggerFileInput}
          disabled={isConverting || isLoading} // Блокируем во время конвертации или загрузки
          className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
        >
          Выбрать файл{multiple ? 'ы' : ''}...
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={multiple ? handleMultiFileChange : handleFileChange}
          className="hidden"
          multiple={multiple}
        />
        {/* Индикатор конвертации или загрузки */}
        {(isConverting || isLoading) && (
          <FaSpinner
            className="animate-spin text-blue-500 ml-3"
            title={isConverting ? "Конвертация..." : "Загрузка..."}
          />
        )}
      </div>

      {/* Контейнер для отображения оригинала и результата WEBP рядом */}
      <div className="flex flex-col md:flex-row md:space-x-4 space-y-4 md:space-y-0">
        {/* 2. Блок превью оригинала и информации */}
        {originalPreview && originalFile && (
          <div className="original-preview flex-1 p-3 border rounded-md bg-gray-50 space-y-3 min-w-[200px]">
            <p className="text-sm font-medium text-gray-600">Оригинал:</p>
            <Image
              src={originalPreview}
              alt="Предпросмотр оригинала"
              width={150}
              height={150}
              className="object-contain rounded border max-h-[150px] mx-auto"
            />
            <div className="text-xs text-gray-500">
              <p>Имя: {originalFile.name}</p>
              <p>Размер: {formatBytes(originalFile.size)}</p>
              <p>Тип: {originalFile.type}</p>
            </div>
          </div>
        )}

        {/* 3. Блок превью локально сконвертированного WEBP */}
        {convertedWebpPreview && convertedWebpFile && (
          <div className="webp-preview flex-1 p-3 border rounded-md bg-blue-50 space-y-3 min-w-[200px]">
            <p className="text-sm font-medium text-blue-700">
              Результат конвертации (локально):
            </p>
            <Image
              src={convertedWebpPreview}
              alt="Предпросмотр WEBP (локально)"
              width={150}
              height={150}
              className="object-contain rounded border max-h-[150px] mx-auto"
            />
            <div className="text-xs text-gray-600">
              <p>Имя: {convertedWebpFile.name}</p>
              <p>Размер: {formatBytes(convertedWebpFile.size)}</p>
              <p>Тип: {convertedWebpFile.type}</p>
            </div>
            {!webpUrl && ( // Показываем кнопку загрузки, если еще не загружено на сервер
              <button
                onClick={handleUploadConvertedWebP} // Используем новую функцию
                disabled={isLoading || isConverting}
                className="mt-2 px-3 py-1.5 text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 flex items-center w-full justify-center"
              >
                {isLoading ? (
                  <FaSpinner className="animate-spin mr-2" />
                ) : (
                  <FaUpload className="mr-2" />
                )}
                {isLoading ? "Загрузка WEBP..." : "Загрузить WEBP на сервер"}
              </button>
            )}
          </div>
        )}
      </div>

      {/* 4. Блок успешно загруженного на сервер WEBP (если webpUrl от сервера есть) */}
      {webpUrl &&
        !initialImageUrl && ( // Показываем если webpUrl от сервера есть и это не initial
          <div className="server-webp-result mt-4 p-3 border rounded-md bg-green-100 space-y-3">
            <p className="text-sm font-medium text-green-700">
              WEBP успешно загружен на сервер:
            </p>
            {fullWebpPreviewUrl && (
              <Image
                src={fullWebpPreviewUrl}
                alt="WEBP с сервера"
                width={100}
                height={100}
                className="object-contain rounded border max-h-[100px] mx-auto"
              />
            )}
            <p className="text-xs text-gray-600 break-all">URL: {webpUrl}</p>
          </div>
        )}

      {/* 5. Блок ошибки */}
      {error && (
        <div className="mt-4 p-3 border border-red-400 rounded-md bg-red-50 text-red-700 text-sm flex items-center">
          <FaTimesCircle className="mr-2" /> {error}
        </div>
      )}
    </div>
  );
};

export default ImageUploader;
