## Полный стек инструментов

| Блок               | Инструменты                                                     |
| ------------------ | --------------------------------------------------------------- |
| **Мониторинг**     | Netdata, Logrotate                                              |
| **Безопасность**   | UFW, Fail2Ban, chkrootkit, unattended-upgrades, Certbot         |
| **Процессы**       | Supervisor                                                      |
| **База / кэш**     | PostgreSQL, Redis                                               |
| **HTTP-стек**      | Nginx (+ WhiteNoise внутри Django)                              |
| **Контейнеры**     | Docker, Docker Compose                                          |
| **CI/CD**          | SourceCraft (репо + пайплайны)                                  |
| **Фоновые задачи** | Celery (RabbitMQ не нужен — Redis как брокер)                   |
| **Конфигурации**   | python-decouple, \*.env                                         |
| **Отладка**        | Sentry SDK для Django и Next.js                                 |
| **Бэкапы**         | rsync (cron-скрипт на домашний ПК или S3-совместимое хранилище) |

---

## Порядок установки (layer-by-layer)

### 0. Базовая подготовка

1. Обновить ОС `sudo apt update && sudo apt upgrade`
2. Создать sudo-пользователя, включить SSH-ключи, отключить вход по паролю.

### 1. Безопасность  *(ставим прежде всего)*

1. **unattended-upgrades** — автопатчи безопасности ([LFCS Certification eBook][1])
2. **UFW** (открываем только 22/tcp, 80, 443) ([LFCS Certification eBook][1])
3. **Fail2Ban** — защита SSH ([LFCS Certification eBook][1])
4. **chkrootkit** — еженедельный скан.
5. **Certbot + Nginx плагин** — сразу получаем TLS ([certbot.eff.org][2])

### 2. Мониторинг

1. **Netdata** одной строчкой ([learn.netdata.cloud][3])
2. Настроить **Logrotate** для Gunicorn, Next.js и ботов.

### 3. Контейнерный слой

1. **Docker Engine** + Docker Compose ([Docker Documentation][4])
2. Добавить пользователя в группу `docker`.

### 4. Data-layer

1. **PostgreSQL 15** из оф. APT-репозитория ([PostgreSQL][5])
2. **Redis** (для Celery и кэша) ([Redis][6])

### 5. Process-layer

1. **Supervisor** — сервисы:

   * `gunicorn-noeon` (Django)
   * `nextjs-noeon` (если SSR без контейнера)
   * `celery-noeon` + `celerybeat` ([DigitalOcean][7])

### 6. HTTP-layer

1. **Nginx** — reverse-proxy к Gunicorn/Next.js ([DigitalOcean][8])
2. Включить HTTP/2, gzip, кэширование статики.
3. `sudo certbot --nginx` — автоматический SSL.

### 7. Приложения

1. **Python-env** (+ `python-decouple`, `whitenoise`) для Django.
2. **Node 18 LTS** или контейнер — для Next.js.
3. В .env хранить секреты и ключи ботов.

### 8. CI/CD

1. Создать репозиторий в **SourceCraft** ([Telecompaper][9])
2. Пайплайн: тесты → build Docker-образов → push → SSH-deploy /  docker-compose up (или Yandex Cloud Registry).
3. Подключить **Sentry** для прод-отслеживания ошибок ([Parsers VC][10])

### 9. Бэкапы

1. Cron-скрипт `rsync` → внешний NAS/S3 ежедневно ([DigitalOcean][11])

---

## Что ещё можно добавить (опционально)
**Watchtower** авто-обновление Docker-контейнеров                                 