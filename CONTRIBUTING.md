# Как внести вклад

1. Форкните репозиторий и создайте ветку от `main`.
2. Установите зависимости:
   - `pip install -r backend/requirements.txt`

- `npm ci --legacy-peer-deps --prefix frontend`

3. Скопируйте `frontend/.env.local.example` в `frontend/.env.local` и заполните значения. В корне проекта скопируйте `.env.example` в `.env` и убедитесь, что переменная `DJANGO_ALLOWED_HOSTS` содержит `backend`.
   Секретные данные храните только локально, их нельзя коммитить.
   Обратите внимание на переменную `NEXT_PUBLIC_API_BASE` — она должна указывать
   на URL вашего бэкенда (обычно `http://localhost:8000/api/v1`).
4. Перед коммитом запустите `pre-commit run --all-files`.
5. Убедитесь, что команды `npm test --prefix frontend` и `pytest -q backend` проходят без ошибок.
6. Покрытие тестами должно оставаться не ниже 95%.
7. Используйте семантические сообщения коммитов и описывайте изменения на русском языке.
8. После проверки CI открывайте Pull Request в `main`.
