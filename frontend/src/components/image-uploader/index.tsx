"use client";

import React, { useState, useRef, useCallback } from "react";
import { fetchWithAuth } from "@/services/apiClient"; // Для отправки файла
import Image from "next/image"; // Для превью
import {
  FaUpload,
  FaCheckCircle,
  FaTimesCircle,
  FaSpinner,
} from "react-icons/fa"; // Иконки

interface ImageUploaderProps {
  label?: string; // Заголовок для поля загрузки
  onUploadComplete: (url: string) => void; // Колбэк при успешном подтверждении WEBP
  initialImageUrl?: string | null; // URL для отображения существующего изображения
  uploadFieldName?: string; // Имя поля для файла в POST запросе (по умолчанию 'upload')
  apiEndpoint?: string; // Эндпоинт для загрузки (по умолчанию '/api/v1/image-upload/')
}

const ImageUploader: React.FC<ImageUploaderProps> = ({
  label = "Загрузить изображение",
  onUploadComplete,
  initialImageUrl = null,
  uploadFieldName = "upload",
  apiEndpoint = "/api/v1/image-upload/",
}) => {
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [originalPreview, setOriginalPreview] = useState<string | null>(null);
  const [webpUrl, setWebpUrl] = useState<string | null>(initialImageUrl);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Новые состояния для локальной конвертации
  const [isConverting, setIsConverting] = useState(false);
  const [convertedWebpFile, setConvertedWebpFile] = useState<File | null>(null);
  const [convertedWebpPreview, setConvertedWebpPreview] = useState<
    string | null
  >(null);

  const djangoApiUrl =
    process.env.NEXT_PUBLIC_DJANGO_API_URL || "http://localhost:8000";
  const fullApiEndpoint = new URL(apiEndpoint, djangoApiUrl).toString();

  // Полный URL для отображения WEBP превью
  const djangoMediaBase = process.env.NEXT_PUBLIC_DJANGO_MEDIA_URL;
  let fullWebpPreviewUrl: string | null = null;

  // --- ОТЛАДКА ---
  console.log(
    "[ImageUploader DEBUG] Raw initialImageUrl prop:",
    initialImageUrl,
  );
  // --- КОНЕЦ ОТЛАДКИ ---

  let currentRelativeWebpPath: string | null = null;
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
      } catch (e) {
        // Ошибка парсинга URL, возможно, это уже был "мусорный" путь с http внутри
        console.error(
          `[ImageUploader ERROR] Не удалось распарсить как URL, хотя начинался с http: ${pathForProcessing}`,
          e,
        );
        pathForProcessing = null; // Считаем путь невалидным
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
      currentRelativeWebpPath = null; // Сбрасываем, если он все еще содержит полный URL
    }
  }

  // --- ОТЛАДКА ---
  console.log(
    "[ImageUploader DEBUG] Effective relative webpUrl for processing:",
    currentRelativeWebpPath,
  );
  console.log(
    "[ImageUploader DEBUG] NEXT_PUBLIC_DJANGO_MEDIA_URL:",
    djangoMediaBase,
  );
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
    } catch (e: any) {
      console.error(
        `[ImageUploader ERROR] Ошибка при формировании fullWebpPreviewUrl из djangoMediaBase ('${djangoMediaBase}') и currentRelativeWebpPath ('${currentRelativeWebpPath}'). Error: ${e.message}`,
      );
      fullWebpPreviewUrl = null;
    }
  } else if (currentRelativeWebpPath) {
    // Запасной вариант, если NEXT_PUBLIC_DJANGO_MEDIA_URL не установлен, но есть относительный путь
    console.warn(
      "[ImageUploader WARN] NEXT_PUBLIC_DJANGO_MEDIA_URL не установлен. Попытка отобразить превью по относительному пути /media/.",
    );
    fullWebpPreviewUrl = `/media/${currentRelativeWebpPath}`;
  }

  // --- ОТЛАДКА ---
  console.log(
    "[ImageUploader DEBUG] Calculated fullWebpPreviewUrl:",
    fullWebpPreviewUrl,
  );
  // --- КОНЕЦ ОТЛАДКИ ---

  // Функция конвертации в WEBP на клиенте
  const convertToWebP = async (file: File): Promise<File | null> => {
    // Целевые параметры
    const TARGET_ASPECT_RATIO = 3 / 1; // ИЗМЕНЕНО: Соотношение сторон 3:1
    const TARGET_WIDTH = 1200; // Фиксированная ширина в пикселях
    const TARGET_HEIGHT = Math.round(TARGET_WIDTH / TARGET_ASPECT_RATIO); // Будет 400px
    const WEBP_QUALITY = 0.85; // Качество WEBP (0.0 - 1.0)

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = document.createElement("img");
        img.onload = () => {
          const canvas = document.createElement("canvas");

          const originalWidth = img.naturalWidth;
          const originalHeight = img.naturalHeight;
          const originalAspectRatio = originalWidth / originalHeight;

          let sourceX = 0;
          let sourceY = 0;
          let sourceWidth = originalWidth;
          let sourceHeight = originalHeight;

          // Рассчитываем размеры и позицию для кропа из оригинала
          if (originalAspectRatio > TARGET_ASPECT_RATIO) {
            // Оригинал шире целевого: обрезаем по горизонтали (X)
            sourceWidth = originalHeight * TARGET_ASPECT_RATIO;
            sourceX = (originalWidth - sourceWidth) / 2;
          } else if (originalAspectRatio < TARGET_ASPECT_RATIO) {
            // Оригинал выше целевого: обрезаем по вертикали (Y)
            sourceHeight = originalWidth / TARGET_ASPECT_RATIO;
            sourceY = (originalHeight - sourceHeight) / 2;
          }
          // Если соотношения совпадают, sourceX, sourceY, sourceWidth, sourceHeight остаются оригинальными

          // Устанавливаем размеры канваса равными целевым размерам
          canvas.width = TARGET_WIDTH;
          canvas.height = TARGET_HEIGHT;

          const ctx = canvas.getContext("2d");
          if (!ctx) {
            return reject(
              new Error("Не удалось получить 2D контекст канваса."),
            );
          }

          // Очищаем канвас (на случай если он используется повторно, хотя здесь создается новый)
          // ctx.clearRect(0, 0, TARGET_WIDTH, TARGET_HEIGHT);

          // Отрисовываем обрезанную и масштабированную часть изображения на канвас
          ctx.drawImage(
            img, // Исходное изображение
            sourceX, // X координата начала кропа на исходном изображении
            sourceY, // Y координата начала кропа на исходном изображении
            sourceWidth, // Ширина кропа на исходном изображении
            sourceHeight, // Высота кропа на исходном изображении
            0, // X координата отрисовки на канвасе (начинаем с 0)
            0, // Y координата отрисовки на канвасе (начинаем с 0)
            TARGET_WIDTH, // Целевая ширина отрисовки на канвасе
            TARGET_HEIGHT, // Целевая высота отрисовки на канвасе
          );

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
        img.onerror = () => {
          reject(new Error("Не удалось загрузить изображение в элемент img."));
        };
        if (event.target?.result && typeof event.target.result === "string") {
          img.src = event.target.result;
        } else {
          reject(
            new Error(
              "Результат FileReader не является строкой или отсутствует.",
            ),
          );
        }
      };
      reader.onerror = () => {
        reject(new Error("Ошибка при чтении файла с помощью FileReader."));
      };
      reader.readAsDataURL(file);
    });
  };

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      setOriginalFile(file);
      setError(null);
      setWebpUrl(null); // Сбрасываем URL от сервера
      setConvertedWebpFile(null); // Сбрасываем предыдущий сконвертированный файл
      setConvertedWebpPreview(null); // Сбрасываем превью сконвертированного файла
      setIsConverting(true); // Показываем индикатор конвертации

      // Генерируем превью оригинала
      const originalPreviewReader = new FileReader();
      originalPreviewReader.onloadend = () => {
        setOriginalPreview(originalPreviewReader.result as string);
      };
      originalPreviewReader.readAsDataURL(file);

      try {
        const webpFile = await convertToWebP(file);
        if (webpFile) {
          setConvertedWebpFile(webpFile);
          // Генерируем превью для локально сконвертированного WEBP
          const webpPreviewReader = new FileReader();
          webpPreviewReader.onloadend = () => {
            setConvertedWebpPreview(webpPreviewReader.result as string);
          };
          webpPreviewReader.readAsDataURL(webpFile);
        } else {
          setError("Не удалось конвертировать изображение в WEBP.");
        }
      } catch (conversionError: any) {
        console.error("Ошибка конвертации в WEBP:", conversionError);
        setError(
          conversionError.message || "Ошибка при конвертации изображения.",
        );
      } finally {
        setIsConverting(false); // Убираем индикатор конвертации
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
    setError(null);

    const formData = new FormData();
    formData.append(uploadFieldName, convertedWebpFile, convertedWebpFile.name);

    console.log("Отправка сконвертированного WEBP на URL:", fullApiEndpoint);

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
          } catch (e) {
            errorMessage = `Ошибка сервера: ${response.status}. Не удалось декодировать JSON с ошибкой.`;
          }
        } else {
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

      // ---- НОВЫЙ ВЫЗОВ onUploadComplete ----
      console.log(
        "[ImageUploader INTERNAL DEBUG] Successfully uploaded. Calling onUploadComplete with URL:",
        result.url,
      );
      onUploadComplete(result.url);
      // ---- КОНЕЦ НОВОГО ВЫЗОВА ----

      // После успешной загрузки и вызова onUploadComplete, можно сбросить локальные файлы, если нужно
      // setOriginalFile(null);
    } catch (err: any) {
      console.error("Ошибка загрузки WEBP:", err);
      setError(
        err.message || "Произошла неизвестная ошибка при загрузке WEBP.",
      );
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
          Выбрать файл...
        </button>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          className="hidden"
        />
        {/* Индикатор конвертации или загрузки */}
        {(isConverting || isLoading) && (
          <FaSpinner
            className="animate-spin text-blue-500 ml-3"
            title={isConverting ? "Конвертация..." : "Загрузка..."}
          />
        )}

        {/* Показываем текущее выбранное изображение (если оно было передано как initialImageUrl) */}
        {initialImageUrl &&
          fullWebpPreviewUrl &&
          !originalFile &&
          !convertedWebpFile && (
            <div className="flex items-center space-x-2 border p-1 rounded ml-auto">
              <Image
                src={fullWebpPreviewUrl}
                alt="Текущее изображение"
                width={40}
                height={40}
                className="object-cover rounded"
              />
              <span className="text-xs text-gray-500 truncate max-w-[150px]">
                {initialImageUrl}
              </span>
              <FaCheckCircle
                className="text-green-500"
                title="Изображение уже загружено"
              />
            </div>
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
