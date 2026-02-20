# Как открыть опрос в браузере

## Вариант 1: Запустить сервер в Терминале (рекомендуется)

1. Открой **Терминал** (Terminal.app) на Mac.
2. Выполни команды:

```bash
cd "/Users/markevlampiev/Downloads/Cursor Files/High-med-risk"
python3 -m http.server 3333
```

3. В браузере открой: **http://localhost:3333**

Главная страница (выбор опроса): http://localhost:3333/index.html  
Medium Risk: http://localhost:3333/medium.html  
High Risk: http://localhost:3333/high.html

Чтобы остановить сервер — нажми в Терминале `Ctrl+C`.

---

## Вариант 2: Открыть файл напрямую (без сервера)

Открой в Safari или другом браузере файл:

```
/Users/markevlampiev/Downloads/Cursor Files/High-med-risk/index.html
```

(Файл → Открыть файл… или перетащи `index.html` в окно браузера.)

**Важно:** при открытии через `file://` сохранение ответов в sessionStorage и переход на страницу результатов обычно работают в том же браузере. Если что-то не сработает — используй Вариант 1 с сервером.
