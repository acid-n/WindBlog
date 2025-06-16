"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Post } from "@/types/blog"; // Используем тот же тип Post
import { useAuth } from "@/contexts/AuthContext";
import { fetchWithAuth } from "@/services/apiClient";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { getBackendOrigin } from "@/lib/getBaseUrl";

const DraftsPage = () => {
  const [drafts, setDrafts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login?next=/admin/drafts");
      return;
    }

    if (user) {
      const fetchDrafts = async (): Promise<Post[]> => {
        setIsLoading(true);
        setError(null);
        try {
          const response = await fetchWithAuth(
            `${getBackendOrigin()}/api/v1/posts/?drafts=true`,
          );
          if (!response.ok) {
            throw new Error("Не удалось загрузить черновики");
          }
          const data: { results: Post[] } = await response.json();
          setDrafts(data.results || []);
          return data.results || [];
        } catch (e: unknown) {
          setError(e instanceof Error ? e.message : String(e));
          console.error("Ошибка загрузки черновиков:", e);
          return [];
        } finally {
          setIsLoading(false);
        }
      };
      fetchDrafts();
    }
  }, [user, authLoading, router]);

  if (authLoading || (isLoading && !drafts.length && !error)) {
    return <p className="text-center py-10">Загрузка черновиков...</p>;
  }

  if (error) {
    return (
      <p className="text-center py-10 text-red-500">
        Ошибка загрузки черновиков: {error}
      </p>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Мои черновики</h1>
      {drafts.length === 0 ? (
        <p className="text-center text-gray-500">У вас пока нет черновиков.</p>
      ) : (
        <ul className="space-y-6">
          {drafts.map((draft) => (
            <li
              key={draft.id}
              className="p-4 border rounded-md shadow-sm bg-white hover:shadow-lg transition-shadow"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-semibold text-blue-700 hover:text-blue-800">
                    <Link href={`/admin/edit-post/${draft.slug}`}>
                      {draft.title || "(Без заголовка)"}
                    </Link>
                  </h2>
                  <p className="text-sm text-gray-500">
                    Последнее изменение:{" "}
                    {format(new Date(draft.updated_at), "d MMM yyyy, HH:mm", {
                      locale: ru,
                    })}
                  </p>
                </div>
                <Link
                  href={`/admin/edit-post/${draft.slug}`}
                  className="mt-1 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 transition-colors"
                >
                  Редактировать
                </Link>
              </div>
              {draft.description && (
                <p className="mt-2 text-gray-700 text-sm italic truncate">
                  {draft.description}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default DraftsPage;
