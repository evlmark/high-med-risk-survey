# Как запустить проект локально

Теперь приложению нужна база данных PostgreSQL (ответы хранятся на сервере) и пароль администратора.

## 1. Поднять PostgreSQL (через Docker — проще всего)

```bash
docker run --name survey-pg -e POSTGRES_PASSWORD=pg -p 5432:5432 -d postgres
```

Если Docker нет — можно установить PostgreSQL локально или использовать публичный `DATABASE_URL`
из базы на Railway.

## 2. Установить зависимости и задать переменные

```bash
cd "/Users/markevlampiev/Downloads/Cursor Files/High-med-risk"
npm install

export DATABASE_URL="postgres://postgres:pg@localhost:5432/postgres"
export ADMIN_PASSWORD="test123"
export DATABASE_SSL=false   # для локального Postgres
```

## 3. Запустить сервер

```bash
npm start
```

В консоли появится `Survey app listening on port 3333` и `[db] Schema ready.`

## 4. Открыть в браузере

- Medium Risk: **http://localhost:3333/medium.html**
- High Risk: **http://localhost:3333/high.html**
- Компания моложе 3 месяцев: **http://localhost:3333/new-company.html**
- Компания старше 3 месяцев: **http://localhost:3333/existing-company.html**
- Админка: **http://localhost:3333/admin.html** (пароль — значение `ADMIN_PASSWORD`)

## 5. Тесты

```bash
npm test
```

Прогоняет `test/smoke.js`: реальный сервер с подставным драйвером БД — статика, заголовки безопасности,
сохранение всех четырёх опросников, лимиты размеров и частоты, заголовки скачивания, сборка PDF.
База данных для этого не нужна.

Корень `/` намеренно отдаёт 404 — страницы со списком ссылок больше нет.

Клиентские файлы лежат в папке `public/` — только она доступна по HTTP. Серверный код
(`server.js`, `db.js`, `auth.js`, `pdf.js`), документация и папка `Design` наружу не отдаются.

Опросник по умолчанию на испанском; переключатель ES/EN — в шапке.

Чтобы остановить сервер — `Ctrl+C` в терминале. Чтобы остановить базу: `docker stop survey-pg`
(и `docker start survey-pg`, чтобы снова запустить — данные сохранятся).
