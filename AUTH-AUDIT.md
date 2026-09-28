# Проверка мобильного входа — 27 сентября 2026

## Подтверждено

- По предоставленному скриншоту клиент GitHub загрузился внутри iframe; ошибка отмечена на auth/vk. Скриншот не показывает фактический HTTP Origin, только location.origin.
- Публичный game-boot.js содержит текущий вход text/plain. Это не старый вариант с application/json.
- Прямой запрос с тестового компьютера: health 200; auth/vk с пустыми параметрами 401 и Access-Control-Allow-Origin: https://hordeminecraft.github.io.
- При Origin: null сервер возвращает 403 без CORS. В журнале повторного входа телефона подтверждён обычный Origin https://hordeminecraft.github.io, не null. Разрешение null вслепую не добавлено.
- Вход отправляется с credentials: omit и без X-Obitel-Session. Блокировка сторонних cookies сама по себе не объясняет отказ этого запроса.
- До настройки секрета сервер отвечал 503, а клиент продолжал как гость. После настройки включилась проверка подписи. Связь появления проблемы с включением авторизации обоснована; неверность самого ключа не доказана.

## Исправлены подтверждённые дефекты

- NETWORK_FETCH больше не маскирует TypeError чтения тела или обработки ответа. Ошибки тела получили RESPONSE_BODY и HTTP-статус.
- Убран незаметный переход в гостевой профиль при 503/404 подписанного входа VK: он мешал проверке синхронизации и мог создать ложное впечатление успешного входа.
- Добавлены проверки клиента: транспорт, декодирование, HTTP 401, структура JSON и параметры запроса без cookies. Все 55 тестов проходят.

## Что пока не установлено

В 22:43:30 GMT+3 журнал Cloudflare зафиксировал повторный вход пользователя из VK iOS: POST /api/auth/vk, Origin https://hordeminecraft.github.io, HTTP 200, outcome ok, 52 мс. Серверная проверка реальной подписи прошла. Не установлено, почему WebView не смог получить этот ответ; успешное получение профиля на телефоне пока не подтверждено. Проверка health не проверяет авторизацию.

Для установления первопричины нужна корреляция одного неуспешного мобильного входа с сетевой записью WebView и журналом Worker. Не следует публиковать URL запуска, sign, ключ или токен сессии в диагностике.

## Источники

- VKCOM, параметры запуска и серверная аутентификация (официальный архив): https://github.com/VKCOM/vk-apps-launch-params
- VKCOM, Bridge и отличия mobile_web/native WebView: https://github.com/VKCOM/vk-bridge/blob/master/packages/core/src/bridge.ts
- MDN fetch: HTTP-ошибка не вызывает отклонение Promise; сетевые ограничения могут вызвать TypeError: https://developer.mozilla.org/en-US/docs/Web/API/Window/fetch
- MDN Response.json: TypeError возможен при декодировании тела: https://developer.mozilla.org/en-US/docs/Web/API/Response/json
- Cloudflare CORS: https://developers.cloudflare.com/workers/examples/cors-header-proxy/

Диагностика улучшена; устранение мобильного сбоя не подтверждено.

## Изменения после проверки Cloudflare

Cloudflare Access не настроен; D1 DB и секрет VK_APP_SECRET присутствуют. Включены журналы; имя wrangler исправлено на фактическое obiteldead. В версии d7a08c4 исключён Set-Cookie для cross-origin ответов: такие клиенты уже передают сессию через X-Obitel-Session. Добавлено безопасное журналирование статуса и CORS ответа входа. Это проверяемая гипотеза совместимости WebView, а не доказанная первопричина.

## Результат 28 сентября

После удаления cookie ошибка осталась (подтверждение пользователя). Запись vk-login-response от 27 сентября 22:46:22 GMT+3: status 200, origin и allowOrigin совпадают с https://hordeminecraft.github.io, cookie false. Гипотеза cookie не подтвердилась.

В 23:34:33 тот же тип клиента VK iOS через сеть с выходом в Испании выполнил вход, OPTIONS /api/profile и GET /api/profile 200 с выданной сессией. Пользователь подтвердил: с VPN игра работает. Установлена зависимость сбоя от сетевого маршрута к Cloudflare; конкретный механизм сетевого ограничения по этим логам не определяется. Cloudflare описывает ограничения российских операторов: https://blog.cloudflare.com/russian-internet-users-are-unable-to-access-the-open-internet/

Подготовлен api-gateway.mjs для размещения на доступном внешнем сервере. Он сохраняет существующий Worker и D1 в качестве единственного источника данных. Публичный адрес клиента ещё не переключён: хостинг шлюза не предоставлен, доступность нового адреса с телефона не проверена. Исправление для игроков пока не завершено.

2026-09-28: deployed isolated PHP transport at api.hordeminecraft.ru/obitel-gateway.php.
Client switches public production requests to this endpoint, keeping signed VK
validation and all saves in the existing Worker/D1. Live health, CORS, invalid
signature rejection, session forwarding and identical player progress verified.
Mobile VK without VPN remains a user-device verification; do not infer success
from server-to-server checks. See GATEWAY-DEPLOY.md.
