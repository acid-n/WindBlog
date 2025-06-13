import { NextResponse, NextRequest } from 'next/server';

/**
 * Edge-compatible middleware для обработки авторизации и редиректов
 * Используется как единая точка для предотвращения циклических редиректов
 * @see https://nextjs.org/docs/app/building-your-application/routing/middleware
 */

// Защищенные пути, требующие авторизации (префиксы)
const PROTECTED_PATHS = [
  '/admin',
  '/admin/create-post',
  '/admin/edit-post', 
  '/admin/drafts'
];

// Исключения из защищенных путей (не требуют редиректа)
const EXCEPTION_PATHS = [
  '/admin/edit-post/'
];

// Максимальная глубина обработки параметра next для предотвращения бесконечных циклов
const MAX_NEXT_DEPTH = 3;

/**
 * Обрабатывает случаи, когда URL содержит циклические параметры next
 * @param url - URL для очистки
 * @returns Очищенный URL
 */
function sanitizeNextParams(url: URL): URL {
  const cleanUrl = new URL(url.origin + url.pathname);
  const nextParam = url.searchParams.get('next');
  
  // Если нет параметра next или он не содержит циклических ссылок, просто возвращаем
  if (!nextParam || !nextParam.includes('next=')) {
    // Копируем все параметры
    url.searchParams.forEach((value, key) => {
      cleanUrl.searchParams.set(key, value);
    });
    return cleanUrl;
  }
  
  // Очищаем вложенные параметры next
  let targetPath = '/';
  let nextDepth = 0;
  
  // Ищем конечный путь администратора в параметре next
  const adminPathRegex = /\/admin\/[\w\-\/\[\]]+(?=\?|$)/;
  const adminMatch = nextParam.match(adminPathRegex);
  
  if (adminMatch && adminMatch[0]) {
    // Нашли путь админа в параметре next
    targetPath = adminMatch[0];
    console.log(`Извлечен путь администратора: ${targetPath}`);
  } else {
    // Пытаемся найти любой валидный путь
    const pathRegex = /\/(\w+\/)*[\w\-\/\[\]]+(?=\?|$)/;
    const pathMatch = nextParam.match(pathRegex);
    
    if (pathMatch && pathMatch[0] && nextDepth < MAX_NEXT_DEPTH) {
      targetPath = pathMatch[0];
      nextDepth++;
    }
  }
  
  // Копируем остальные параметры (кроме next)
  url.searchParams.forEach((value, key) => {
    if (key !== 'next') {
      cleanUrl.searchParams.set(key, value);
    }
  });
  
  // Устанавливаем чистый параметр next
  if (targetPath !== '/') {
    cleanUrl.searchParams.set('next', targetPath);
  }
  
  return cleanUrl;
}

/**
 * Проверяет, является ли путь страницей редактирования поста
 * @param pathname Проверяемый путь
 * @returns true если это страница редактирования поста
 */
function isEditPostPage(pathname: string): boolean {
  return /^\/admin\/edit-post\/[\w-]+/.test(pathname);
}

/**
 * Middleware-функция Next.js, обрабатывающая все запросы
 */
export function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();
  const { pathname } = url;
  
  console.log(`Middleware обрабатывает путь: ${pathname}`);
  
  // Если это страница редактирования поста - пропускаем без изменений
  if (isEditPostPage(pathname)) {
    console.log(`Пропускаем страницу редактирования поста: ${pathname}`);
    return NextResponse.next();
  }
  
  // Предотвращаем циклические редиректы на странице входа
  if (pathname === '/login') {
    // Проверяем наличие циклических параметров next
    const nextParam = url.searchParams.get('next');
    if (nextParam && nextParam.includes('next=')) {
      const cleanUrl = sanitizeNextParams(url);
      return NextResponse.redirect(cleanUrl);
    }
    
    // Если есть дублирующиеся параметры next с admin/login, перенаправляем
    if (nextParam && nextParam.includes('/admin/login')) {
      const cleanUrl = new URL(url);
      cleanUrl.searchParams.delete('next');
      return NextResponse.redirect(cleanUrl);
    }
  }
  
  // Предотвращаем доступ к /admin/login - этого маршрута не должно быть
  if (pathname.startsWith('/admin/login')) {
    // Перенаправляем на основную страницу логина
    const redirectUrl = new URL('/login', request.url);
    return NextResponse.redirect(redirectUrl);
  }
  
  // Обрабатываем все остальные запросы как обычно
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Обрабатываем все пути, связанные с авторизацией и администрированием,
     * чтобы предотвратить циклические редиректы
     */
    '/login',
    '/admin/:path*',
  ],
}
