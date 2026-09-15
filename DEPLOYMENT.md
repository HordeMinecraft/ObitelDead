# Публикация на SourceCraft

Публичный клиент: https://obitel.sourcecraft.site/obitel/.
Конфигурация `.sourcecraft/sites.yaml` публикует `dist/client` из `main`.

SourceCraft Sites выполняет только HTML/CSS/JS в браузере. Серверные файлы из `dist/server` там не запускаются. Поэтому перенос файлов сам по себе не включает `/api/profile`, инвентарь или общих боссов.

`config.js` направляет клиент SourceCraft на подготовленный HTTPS API. Worker принимает запросы только своего сайта и точного Origin `https://obitel.sourcecraft.site`; OPTIONS и гостевые сессии через `X-Obitel-Session` позволяют играть без сторонних cookie. Токен гостя хранится отдельно от игрового прогресса; секретов разработчика в клиенте нет.

Для реальной работы нужна публичная доступность API, публикация новой серверной сборки и новой клиентской сборки. Пока доступ API ограничен владельцем, игроки не смогут подключиться.

Сборка: `pnpm build`. После неё коммитятся клиентские артефакты, которые уже отслеживаются этим репозиторием, и выполняется push в правильный репозиторий SourceCraft. Сайт обновляется в течение нескольких минут. PAT передаётся только через аутентификацию Git/API, никогда через файлы проекта.

В текущем локальном Git origin указан `topcollege/obitel`, тогда как пользовательский URL соответствует `obitel/obitel`. До загрузки необходимо проверить фактический репозиторий через SourceCraft. Во время проверки 15 сентября 2026 сайт, API и Git SourceCraft не завершили подключение с этого компьютера. Изменять чужой или неподтверждённый репозиторий нельзя.

Официальные источники:
- https://sourcecraft.dev/portal/docs/ru/sourcecraft/concepts/sites
- https://sourcecraft.dev/portal/docs/ru/sourcecraft/tutorials/sites
- https://sourcecraft.dev/portal/docs/ru/sourcecraft/operations/api-start

Локальная проверка: `node server.mjs`. Интеграционные тесты: `node --test tests/*.test.mjs`.
