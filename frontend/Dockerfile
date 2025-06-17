# Этап 1: Сборка зависимостей
FROM node:18-alpine AS deps
WORKDIR /app

# Копируем package.json и package-lock.json
COPY package.json package-lock.json* ./

# Устанавливаем зависимости
RUN npm install --frozen-lockfile

# Этап 2: Сборка приложения
FROM node:18-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ARG NEXT_PUBLIC_API_BASE
ARG DJANGO_API_URL_SSR
ENV NEXT_PUBLIC_API_BASE=$NEXT_PUBLIC_API_BASE \
    DJANGO_API_URL_SSR=$DJANGO_API_URL_SSR

RUN npm run build

# Этап 3: Production-образ
FROM node:18-alpine AS runner
WORKDIR /app

ARG NEXT_PUBLIC_API_BASE
ARG DJANGO_API_URL_SSR
ENV NODE_ENV=production \
    NEXT_PUBLIC_API_BASE=$NEXT_PUBLIC_API_BASE \
    DJANGO_API_URL_SSR=$DJANGO_API_URL_SSR

# Копируем только необходимые артефакты сборки и производственные зависимости
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next

# Если вы используете next/image с оптимизацией по умолчанию, 
# и не хотите, чтобы изображения оптимизировались при каждом запуске контейнера,
# вы можете раскомментировать следующую строку, чтобы скопировать кэш изображений.
# Однако, это увеличит размер образа.
# COPY --from=builder /app/.next/cache/images ./.next/cache/images

# Устанавливаем пользователя без root-прав для безопасности (рекомендуется)
# Создаем группу и пользователя nextjs
RUN addgroup -S nextjs && adduser -S nextjs -G nextjs
USER nextjs

# Передаем владение рабочей директорией новому пользователю
# Это необходимо, если Next.js пытается писать в .next/cache во время выполнения (например, для ISR или кэша изображений)
RUN chown -R nextjs:nextjs /app

EXPOSE 3000

# Команда для запуска приложения Next.js
# Next.js по умолчанию слушает 0.0.0.0:3000 при запуске через `npm start` в production
CMD ["npm", "start"] 