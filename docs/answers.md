# Ответы к защите ПР № 3

**Источники:** `dataset/dashboard.json` и `dataset/notifications.json`, сейчас это демонстрационные данные, поскольку оригинальный архив dataset не был приложен к заданию.

**Как строится интерфейс:** `loadData()` в `js/app.js` вызывает `fetch()`, затем `renderMetrics()` выводит показатели, `renderActivities()` — таблицу, `renderTasks()` — задачи.

**Проверка ошибок:** HTML-поля `required`, `minlength`, `type=email`. Дополнительно `validate()` проверяет значение и ставит Bootstrap-классы `is-invalid` и `is-valid`.

**Что выполняет Bootstrap JS:** navbar collapse, modal, offcanvas, accordion, toast.

**Что выполняет собственный JS:** чтение JSON, создание элементов интерфейса, сохранение строки в памяти страницы, обработка ввода и отметок задач, расчёт прогресса и запуск toast через `bootstrap.Toast.getOrCreateInstance()`.

**Запуск с нуля:** в каталоге проекта выполнить `python -m http.server 8000`, открыть `http://localhost:8000` и проверить элементы. Нужен интернет для Bootstrap CDN.

**Расширение:** подключить серверный API для постоянного сохранения записей, разнести модули и внедрить тесты.

**Семантика HTML:** `header`, `nav`, `main`, `section`, `footer` выражают назначение блоков; Bootstrap CSS оформляет их визуально.