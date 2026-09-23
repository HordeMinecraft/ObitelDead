# Рабочая схема публикации

Подтверждено владельцем и HTTP-проверкой 23 сентября 2026.

- Клиент игры: https://hordeminecraft.github.io/ObitelDead/
- Репозиторий: https://github.com/HordeMinecraft/ObitelDead, ветка main.
- API: https://obiteldead.deniswww127.workers.dev/api/
- Сервер: Cloudflare Worker obiteldead, автоматически собирается из GitHub.
- База: Cloudflare D1, привязка DB.
- obitel.pages.dev — старое отдельное размещение, не используется для текущей игры. Не загружать туда релизы без отдельного запроса владельца.

После изменений: node --test tests/*.test.mjs, node build.mjs, добавить обновлённые game-boot.js/platform.js в коммит и отправить main. Проверять клиент на GitHub Pages, а API — на Worker с Origin https://hordeminecraft.github.io.

В VK запускается клиент игры. Текущий URL в кабинете VK непосредственно не проверен; браузерный доступ к VK заблокирован политикой безопасности.
