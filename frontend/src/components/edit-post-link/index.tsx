"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { FaEdit } from "react-icons/fa";
import Link from "next/link";
import logger from "@/services/logger";

interface EditPostLinkProps {
  slug: string;
}

/**
 * Компонент кнопки редактирования поста
 * Использует программную навигацию вместо Link для гарантированного сохранения состояния авторизации
 */
const EditPostLink: React.FC<EditPostLinkProps> = ({ slug }) => {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const componentName = "EditPostLink";
  
  // Добавим логирование при рендеринге компонента
  logger.debug(`Рендеринг компонента для slug: ${slug}`, componentName, {
    slug,
    userId: user?.id,
    isAuthenticated: !!user,
    isLoading: authLoading
  });

  // Не отображаем кнопку, пока идет проверка аутентификации
  if (authLoading) {
    logger.debug(`Загрузка данных аутентификации, кнопка скрыта`, componentName);
    return null;
  }

  // Не отображаем кнопку, если пользователь не аутентифицирован
  if (!user) {
    logger.debug(`Пользователь не авторизован, кнопка скрыта`, componentName);
    return null;
  }
  
  // Подготовка URL для редактирования
  const editUrl = `/admin/edit-post/${slug}`;
  logger.info(`URL для редактирования подготовлен: ${editUrl}`, componentName, { slug, editUrl });
  
  // Функция для программной навигации на страницу редактирования
  const handleEditClick = (e: React.MouseEvent) => {
    e.preventDefault();
    
    logger.info(`Клик по кнопке редактирования для slug: ${slug}`, componentName, {
      slug,
      currentUrl: window.location.href,
      targetUrl: editUrl
    });
    
    // Используем стандартную навигацию Next.js
    try {
      // Используем встроенный Next.js router для сохранения состояния авторизации
      logger.info(`Навигация на страницу редактирования через router.push`, componentName);
      router.push(editUrl);
    } catch (error) {
      logger.error(`Ошибка при навигации на страницу редактирования`, componentName, {
        error: error instanceof Error ? error.message : String(error)
      });
      
      // Используем элемент Link для навигации как резервный план
      const linkElement = document.getElementById(`edit-link-${slug}`);
      if (linkElement && linkElement instanceof HTMLAnchorElement) {
        logger.info(`Резервная навигация через предзагруженную ссылку`, componentName);
        linkElement.click();
      } else {
        logger.info(`Резервная навигация через window.location`, componentName);
        window.location.href = editUrl;
      }
    }
  };

  return (
    <>
      {/* Кнопка редактирования */}
      <button
        onClick={handleEditClick}
        title="Редактировать пост"
        className="inline-flex items-center text-gray-500 hover:text-blue-600 transition-colors mr-2 border-none bg-transparent p-0"
        aria-label="Редактировать пост"
        data-testid="edit-post-button"
      >
        <FaEdit size={16} />
      </button>
      
      {/* Скрытая ссылка для резервной навигации */}
      <Link 
        href={editUrl} 
        prefetch={true}
        id={`edit-link-${slug}`} 
        className="hidden" 
      >
        Редактировать пост
      </Link>
    </>
  );
};

export default EditPostLink;
