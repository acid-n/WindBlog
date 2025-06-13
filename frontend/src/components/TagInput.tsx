import React, { useState, useEffect, useRef } from "react";
import clsx from "clsx";

interface Tag {
  id: number;
  name: string;
  slug: string;
}

interface TagInputProps {
  value: number[];
  onChange: (ids: number[]) => void;
  maxTags?: number;
  fetchTagsUrl?: string; // e.g. "/api/tags/"
  createTagUrl?: string; // e.g. "/api/tags/"
  disabled?: boolean;
}

const DEFAULT_MAX_TAGS = 5;

const TagInput: React.FC<TagInputProps> = ({
  value,
  onChange,
  maxTags = DEFAULT_MAX_TAGS,
  fetchTagsUrl = "/api/tags/",
  createTagUrl = "/api/tags/",
  disabled = false,
}) => {
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [suggestions, setSuggestions] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setLoading(true);
    fetch(fetchTagsUrl)
      .then((res) => res.json())
      .then((data) => {
        // Если API вернул объект с results, берём results, иначе сам data
        setAllTags(Array.isArray(data) ? data : data.results || []);
        setLoading(false);
      })
      .catch(() => {
        setError("Ошибка загрузки тегов");
        setLoading(false);
      });
  }, [fetchTagsUrl]);

  useEffect(() => {
    if (!inputValue) {
      setSuggestions([]);
      return;
    }
    const filtered = Array.isArray(allTags)
      ? allTags.filter(
          (tag) =>
            tag.name.toLowerCase().includes(inputValue.toLowerCase()) &&
            !value.includes(tag.id)
        )
      : [];
    setSuggestions(filtered);
  }, [inputValue, allTags, value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    setError(null);
  };

  const handleAddTag = (tag: Tag) => {
    if (value.length >= maxTags) return;
    if (!value.includes(tag.id)) {
      onChange([...value, tag.id]);
    }
    setInputValue("");
    setSuggestions([]);
  };

  const handleRemoveTag = (id: number) => {
    onChange(value.filter((tid) => tid !== id));
  };

  const handleInputKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    console.log('[TagInput] keydown:', e.key, {inputValue, value, maxTags});
    // Добавление по Enter или запятой
    const isComma = e.key === ',' || e.key === 'Comma' || e.keyCode === 188;
    if ((e.key === "Enter" || isComma) && inputValue.trim()) {
      // Проверяем, есть ли такой тег среди suggestions
      const existing = allTags.find(
        (tag) => tag.name.toLowerCase() === inputValue.trim().toLowerCase()
      );
      if (existing) {
        handleAddTag(existing);
        return;
      }
      // Создаём новый тег через API
      if (value.length >= maxTags) return;
      setLoading(true);
      setError(null);
      let lastStatus: number | undefined = undefined;
      try {
        // Используем fetchWithAuth для авторизации
        // (импортировать из '@/services/apiClient')
        const { fetchWithAuth } = await import("@/services/apiClient");
        let newTag = null;
        let isConflict = false;
        let res;
        try {
          res = await fetchWithAuth(createTagUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ name: inputValue.trim() }),
          });
          lastStatus = res.status;
          if (res.status === 409) {
            isConflict = true;
            // Даже при 409 DRF возвращает тег в теле ответа
            const conflictTag = await res.json();
            if (conflictTag && conflictTag.id && conflictTag.name) {
              handleAddTag(conflictTag); // <--- ВАЖНО: сразу добавляем тег!
              setAllTags((prev) => prev.some(t => t.id === conflictTag.id) ? prev : [...prev, conflictTag]);
              setInputValue("");
              setSuggestions([]);
              setError(null);
              setLoading(false);
              return;
            } else {
              setError("Такой тег уже существует, но не удалось получить id. Попробуйте обновить страницу.");
              setLoading(false);
              return;
            }
          }
          if (!res.ok && !isConflict) {
            throw new Error("Ошибка создания тега");
          }
          if (res.ok) {
            newTag = await res.json();
            console.log('[TagInput] POST /tags/ ответ:', newTag);
            if (newTag && newTag.id && newTag.name) {
              handleAddTag(newTag); // <--- Сначала добавляем тег
              setAllTags((prev) => prev.some(t => t.id === newTag.id) ? prev : [...prev, newTag]);
              setInputValue("");
              setSuggestions([]);
              setError(null);
              setLoading(false);
              return;
            }
          }
        } catch (e) {
          if (!isConflict) {
            setError('Ошибка создания тега');
            console.error('[TagInput] Ошибка создания тега:', e);
          }
        } finally {
          setLoading(false);
        }
        // После любого POST (даже 409) обновляем все теги с сервера
        try {
          const resAll = await fetch(fetchTagsUrl);
          const dataAll = await resAll.json();
          const tagsArr = Array.isArray(dataAll) ? dataAll : dataAll.results || [];
          setAllTags(tagsArr);
        } catch (e) {
          setError('Ошибка загрузки тегов после создания');
          console.error('[TagInput] Ошибка загрузки тегов после создания:', e);
        }
      } catch (err) {
        setError('Неизвестная ошибка при создании тега');
        console.error('[TagInput] Неизвестная ошибка:', err);
      }
    }
    if (e.key === "Backspace" && !inputValue && value.length > 0) {
      handleRemoveTag(value[value.length - 1]);
    }
  };

  console.log('[TagInput] render', {value, allTags, suggestions, inputValue, maxTags, disabled});
  return (
    <div className="tag-input">
      <div className="flex flex-wrap gap-2 mb-2">
        {value.map((id) => {
          const tag = allTags.find((t) => t.id === id);
          if (!tag) return null;
          return (
            <span
              key={id}
              className={clsx(
                "inline-flex items-center px-3 py-1 rounded-full bg-indigo-100 text-indigo-800 text-sm font-medium",
                disabled && "opacity-60 cursor-not-allowed"
              )}
            >
              {tag.name}
              {!disabled && (
                <button
                  type="button"
                  onClick={() => handleRemoveTag(id)}
                  className="ml-2 text-indigo-500 hover:text-red-500 focus:outline-none"
                  aria-label="Удалить тег"
                >
                  ×
                </button>
              )}
            </span>
          );
        })}
      </div>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleInputKeyDown}
          disabled={disabled || value.length >= maxTags}
          placeholder={
            value.length >= maxTags
              ? `Максимум ${maxTags} тегов`
              : "Введите тег..."
          }
          className={clsx(
            "w-full border rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500",
            (disabled || value.length >= maxTags) && "bg-gray-100 cursor-not-allowed"
          )}
        />
        {suggestions.length > 0 && (
          <ul className="absolute z-10 bg-white border rounded-md mt-1 w-full shadow-lg max-h-48 overflow-y-auto">
            {suggestions.map((tag) => (
              <li
                key={tag.id}
                className="px-4 py-2 hover:bg-indigo-50 cursor-pointer"
                onMouseDown={() => handleAddTag(tag)}
              >
                {tag.name}
              </li>
            ))}
          </ul>
        )}
      </div>
      {error && <div className="text-red-500 text-sm mt-1">{error}</div>}
      <style jsx>{`
        .tag-input input {
          min-width: 150px;
        }
      `}</style>
    </div>
  );
};

export default TagInput;
