# Как выложить проект High-med-risk в онлайн (Railway)

Функционал остаётся тем же: **одна сессия в браузере = один результат**. Результаты хранятся только в `sessionStorage` (ничего не сохраняется на сервере). У каждого пользователя своя сессия.

---

## 1. Подготовка репозитория (GitHub)

1. Создай новый репозиторий на GitHub (например `high-med-risk-survey`).
2. В папке проекта выполни в Терминале:

```bash
cd "/Users/markevlampiev/Downloads/Cursor Files/High-med-risk"

# Инициализация Git (если ещё не сделано)
git init

# Игнорировать лишнее
echo "node_modules/" >> .gitignore
echo ".env" >> .gitignore
echo ".DS_Store" >> .gitignore

# Добавить все файлы и первый коммит
git add .
git commit -m "Survey app for Railway"

# Подключить свой репозиторий (замени URL на свой)
git remote add origin https://github.com/ТВОЙ_ЛОГИН/high-med-risk-survey.git

# Отправить код
git branch -M main
git push -u origin main
```

Деплоить нужно только файлы приложения (HTML, CSS, JS, `server.js`, `package.json`). Папки `Design` и текстовые таски можно не включать в репозиторий или оставить — на работу опросов это не влияет.

---

## 2. Деплой на Railway

1. Зайди на [railway.com](https://railway.com) и войди в аккаунт.
2. **New Project** → **Deploy from GitHub repo**.
3. Выбери репозиторий `high-med-risk-survey` (или как назвал). Подключи GitHub, если ещё не подключён.
4. Railway сам определит Node.js по `package.json`, выполнит `npm install` и `npm start`.
5. В настройках сервиса открой **Settings** → **Networking** → **Generate Domain**. Railway выдаст ссылку вида `https://xxx.up.railway.app`.

Готово. По этой ссылке открывается главная страница с выбором «Medium Risk Survey» и «High Risk Survey».

---

## 3. Как это работает

- **Сервер** только раздаёт статические файлы (HTML, CSS, JS) и `index.html` по корню.
- **Данные** не уходят на сервер: ответы и файлы хранятся в `sessionStorage` в браузере пользователя.
- **Одна вкладка = одна сессия**: закрыл вкладку — данные этой «сессии» пропадают; в новой вкладке — новая сессия.
- У каждого пользователя (и у каждой вкладки) свои результаты, без общего хранилища.

Дополнительные переменные окружения или база данных не нужны.

---

## 4. Обновление после изменений

После правок в коде:

```bash
cd "/Users/markevlampiev/Downloads/Cursor Files/High-med-risk"
git add .
git commit -m "Update survey"
git push
```

Railway при включённом автодеплое сам пересоберёт и перезапустит приложение; ссылка останется той же.
