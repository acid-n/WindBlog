"use client";

import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { FaEdit } from "react-icons/fa";

interface EditPostLinkProps {
  slug: string;
}

const EditPostLink: React.FC<EditPostLinkProps> = ({ slug }) => {
  const { user, isLoading: authLoading } = useAuth();

  // Не отображаем кнопку, пока идет проверка аутентификации
  if (authLoading) {
    return null;
  }

  // Не отображаем кнопку, если пользователь не аутентифицирован
  if (!user) {
    return null;
  }

  return (
    <Link
      href={`/admin/edit-post/${slug}`}
      title="Редактировать пост"
      className="inline-flex items-center text-gray-500 hover:text-blue-600 transition-colors mr-2"
      aria-label="Редактировать пост"
    >
      <FaEdit size={16} />
    </Link>
  );
};

export default EditPostLink;
