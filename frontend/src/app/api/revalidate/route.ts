import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

// Пример: POST /api/revalidate?path=/blog&secret=YOUR_SECRET_TOKEN
// Или для ревалидации конкретного поста: POST /api/revalidate?path=/posts/your-post-slug&secret=YOUR_SECRET_TOKEN

export async function POST(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get("secret");
  const path = request.nextUrl.searchParams.get("path");

  // 1. Проверяем секретный токен (для безопасности)
  // Вам нужно будет установить эту переменную окружения
  if (secret !== process.env.REVALIDATE_SECRET_TOKEN) {
    return NextResponse.json({ message: "Invalid token" }, { status: 401 });
  }

  // 2. Проверяем, передан ли путь
  if (!path) {
    return NextResponse.json(
      { message: "Path to revalidate is required" },
      { status: 400 },
    );
  }

  try {
    // 3. Выполняем ревалидацию
    // revalidatePath работает для Server Components и Client Components, которые используют fetch
    // или React Server Components, которые возвращают данные.
    // Если путь является layout, он ревалидирует все страницы в этом layout.
    revalidatePath(path, "page"); // 'page' для ревалидации конкретной страницы, 'layout' для layout
    console.log(`Revalidated path: ${path}`);
    return NextResponse.json({
      revalidated: true,
      now: Date.now(),
      path: path,
    });
  } catch (err: any) {
    console.error(`Error revalidating path ${path}:`, err);
    // Если путь не существует, revalidatePath выбросит ошибку. Это нормально.
    // Если происходит другая ошибка, это может быть проблема.
    return NextResponse.json(
      { message: "Error revalidating", error: err.message },
      { status: 500 },
    );
  }
}

// Также можно использовать GET, если предпочитаете, но POST более семантичен для действия
export async function GET(request: NextRequest) {
  return POST(request); // Просто перенаправляем на POST для удобства
}
