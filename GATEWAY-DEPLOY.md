# Размещение API-шлюза

Статус: подготовлен и протестирован; публично не развёрнут.

1. На сервере вне Cloudflare проверить исходящий HTTPS-доступ к текущему Worker. Сервер с тем же ограничением сети задачу не решит.
2. Запустить `node api-gateway.mjs` (Node 24, переменная PORT, по умолчанию 8080) либо собрать `docker build -f Dockerfile.gateway -t obitel-gateway .` и запустить контейнер за HTTPS-прокси хостинга.
3. Подключить публичный HTTPS-адрес. Не размещать его за прокси Cloudflare. Не открывать порт 8080 напрямую в интернет: TLS должен завершаться на прокси хостинга.
4. Проверить `/api/health`, запрос входа из VK на телефоне без VPN, затем чтение того же профиля с ПК. Не переносить VK_APP_SECRET: проверка подписи остаётся на существующем Worker.
5. Только после проверки изменить CLOUD_API в config.js, предусмотрев перенос локального ключа сессии со старого API-адреса для гостевых профилей. Собрать клиент, опубликовать и проверить реальные устройства.

Шлюз пересылает запросы исключительно существующему API, не записывает тела запросов или токены и не создаёт отдельную БД. Обратное переключение API-адреса не меняет серверный прогресс. Подключение любого нового сервера нужно проверять из сети игрока; работа через VPN недостаточна.

## Production PHP gateway — 2026-09-28

Frontend remains https://hordeminecraft.github.io/ObitelDead/.
API transport now uses https://api.hordeminecraft.ru/obitel-gateway.php?route=health
(and route=auth%2Fvk, profile, etc.). Deploy the repository's obitel-gateway.php
as /www/api.hordeminecraft.ru/obitel-gateway.php. No root rewrite changes.

The gateway forwards only to the existing obiteldead Worker and D1. It contains
no VK secret, database credentials, local DB access, or Minecraft includes.
HTTPS verification stays enabled. Session headers and signed VK launch bodies
are forwarded; cookies are not used for game authentication. Hosting provider
DDoS protection may add its own cookies; the client uses credentials: omit.

Verified live: health 200, invalid VK login 401, OPTIONS 204, foreign origin 403,
invalid route 404, oversized request 413. A guest session returned the same player
code, XP, inventory and currencies through gateway and direct Worker. Automatic
energy timestamps advance normally. Original root API response is unchanged.
The temporary probe/deployment file is disabled (404). No Minecraft files or DB
were changed. The client migrates the old production session key, preserving it
for rollback. Signed VK identity is still verified by the same backend.

Remaining external verification: a fresh launch inside mobile VK with VPN OFF.
Server tests cannot prove reachability from that phone's network.
