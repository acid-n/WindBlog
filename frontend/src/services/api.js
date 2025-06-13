// Реализация API для работы с бэкендом блога

/**
 * Определение базового URL для API запросов
 * В зависимости от окружения используем разные стратегии
 */
function getApiBaseUrl() {
  // Определяем, выполняется ли код на сервере или в браузере
  const isServer = typeof window === 'undefined';
  
  if (isServer) {
    // На сервере (при SSR) используем прямой URL к контейнеру Docker
    return 'http://backend:8000/api/v1';
  }
  
  // В браузере используем относительный путь или абсолютный URL
  // Чтобы избежать ошибок с локальными адресами localhost:8000
  return '/api/v1';
}

/**
 * Хелпер для выполнения API запросов с обработкой ошибок
 * @param {string} endpoint - Конечная точка API (без базового URL)
 * @param {Object} options - Опции для fetch
 * @returns {Promise<any>} - Результат запроса
 */
async function apiRequest(endpoint, options = {}) {
  const url = `${getApiBaseUrl()}${endpoint}`;
  
  try {
    // Добавляем заголовки по умолчанию, если не указано иное
    const headers = options.headers || {};
    if (options.body && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }
    
    // Выполняем запрос
    const response = await fetch(url, {
      ...options,
      headers,
      // Добавляем опцию cache: 'no-store' для обхода проблем с кэшированием в Next.js
      cache: 'no-store'
    });
    
    if (!response.ok) {
      // Пытаемся получить подробности ошибки, если они есть
      let errorDetails = {};
      try {
        errorDetails = await response.json();
      } catch (e) {
        // Если не удалось получить JSON, используем текст
        errorDetails = { detail: await response.text() };
      }
      
      throw {
        status: response.status,
        message: errorDetails.detail || `Ошибка ${response.status}`,
        details: errorDetails
      };
    }
    
    // Если в ответе нет данных, возвращаем успех
    if (response.status === 204) {
      return { success: true };
    }
    
    // Возвращаем данные в формате JSON
    return await response.json();
    
  } catch (error) {
    // Обрабатываем и логируем ошибку
    console.error(`Ошибка при запросе к ${url}:`, error);
    // Пробрасываем ошибку дальше
    throw error;
  }
}

/**
 * Получение списка постов с пагинацией
 * @param {number} page - Номер страницы
 * @returns {Promise<Object>} - Объект с результатами и метаданными пагинации
 */
export async function fetchPosts(page = 1) {
  try {
    return await apiRequest(`/posts/?page=${page}`);
  } catch (error) {
    console.error('Ошибка при загрузке постов:', error);
    throw error;
  }
}

/**
 * Получение деталей поста по slug
 * @param {string} slug - Уникальный идентификатор поста
 * @returns {Promise<Object>} - Данные поста
 */
export async function fetchPostBySlug(slug) {
  try {
    return await apiRequest(`/posts/${slug}/`);
  } catch (error) {
    console.error(`Ошибка при загрузке поста ${slug}:`, error);
    throw error;
  }
}

/**
 * Алиас для fetchPostBySlug для совместимости с кодом страницы поста
 * @param {string} slug - Уникальный идентификатор поста
 * @returns {Promise<Object>} - Данные поста
 */
export const fetchPost = fetchPostBySlug;

/**
 * Получение списка тегов
 * @returns {Promise<Array>} - Массив тегов
 */
export async function fetchTags() {
  try {
    return await apiRequest('/tags/');
  } catch (error) {
    console.error('Ошибка при загрузке тегов:', error);
    throw error;
  }
}

/**
 * Получение постов по тегу
 * @param {string} tagSlug - Slug тега
 * @param {number} page - Номер страницы
 * @returns {Promise<Object>} - Объект с результатами и метаданными пагинации
 */
export async function fetchPostsByTag(tagSlug, page = 1) {
  try {
    return await apiRequest(`/tags/${tagSlug}/posts/?page=${page}`);
  } catch (error) {
    console.error(`Ошибка при загрузке постов по тегу ${tagSlug}:`, error);
    throw error;
  }
}

/**
 * Отправка формы обратной связи
 * @param {Object} data - Данные формы
 * @returns {Promise<Object>} - Результат отправки
 */
export async function submitContactForm(data) {
  try {
    return await apiRequest('/contact/', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  } catch (error) {
    console.error('Ошибка при отправке формы обратной связи:', error);
    throw error;
  }
}

/**
 * Получение настроек сайта
 * @returns {Promise<Object>} - Объект с настройками сайта
 */
export async function fetchSiteSettings() {
  try {
    console.log(`[Диагностика] Запрос настроек сайта через API`);
    
    // Вместо использования apiRequest, делаем прямой fetch с корректным URL
    // Важно: в Django настроен URL без завершающего слеша
    const url = `/api/v1/site-settings`;
    
    console.log(`Отправляем запрос на: ${url}`);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      cache: 'no-store'
    });
    
    if (!response.ok) {
      throw new Error(`Ошибка загрузки настроек сайта: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log(`Успешно получены настройки сайта:`, data);
    return data;
  } catch (error) {
    console.error('Ошибка при загрузке настроек сайта:', error);
    throw error;
  }
}

/**
 * Универсальный фетчер для клиентских компонентов
 * @param {string} url - URL для запроса 
 * @returns {Promise<any>} - Результат запроса
 */
export async function fetcher(url) {
  // Простой фетчер без дополнительной логики
  const endpoint = url.startsWith('/api/') ? url.substring(4) : url;
  return apiRequest(endpoint);
}

/**
 * Фетчер для постов по slug (для использования в клиентских компонентах)
 * @param {string} slug - Slug поста
 * @returns {Promise<any>} - Результат запроса
 */
export async function postFetcher(slug) {
  return apiRequest(`/posts/${slug}/`);
}
