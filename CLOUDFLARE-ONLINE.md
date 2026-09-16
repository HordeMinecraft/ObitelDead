# Обитель Мёртвых — онлайн через Cloudflare Workers + D1

Статика игры остаётся на GitHub Pages:

`https://hordeminecraft.github.io/ObitelDead/`

Игровой API выполняется в Cloudflare Worker, а общий прогресс хранится в D1.

## Что уже реализовано

- серверные профили и сохранения;
- общий прогресс между сессиями одного браузера;
- зачистки, награды, энергия, оружие, броня и улучшения на сервере;
- общие рейд-боссы;
- список друзей внутри игры;
- приглашения через VK и выбор друзей VK;
- статус друзей «в сети»;
- общий счётчик игроков онлайн;
- таблица лидеров;
- heartbeat каждые 30 секунд;
- bearer-сессия через `X-Obitel-Session`, поэтому API работает из iframe VK без third-party cookies;
- CORS для GitHub Pages;
- оптимистичная запись D1 по `revision`, чтобы параллельные атаки на босса не затирали друг друга.

## 1. Создай D1

В корне проекта выполни:

```bash
npx wrangler login
npx wrangler d1 create obitel-dead
```

Cloudflare напечатает `database_id`.

Открой `wrangler.jsonc` и замени:

```text
PASTE_D1_DATABASE_ID_HERE
```

на полученный UUID.

## 2. Примени таблицу D1

В проекте уже есть миграция `drizzle/0000_noisy_old_lace.sql`.

После подстановки `database_id` выполни:

```bash
npx wrangler d1 migrations apply obitel-dead --remote
```

После подтверждения в D1 появятся таблицы `game_world` и `d1_migrations`.

## 3. Подключи GitHub к Cloudflare Worker

Cloudflare Dashboard → **Workers & Pages** → **Create application** → **Import a repository**.

Выбери:

```text
HordeMinecraft/ObitelDead
```

Настройки:

```text
Production branch: main
Root directory: /
Build command: оставить пустым
Deploy command: npx wrangler deploy
Worker name: obitel-dead-api
```

`wrangler.jsonc` уже указывает `worker.js` как entry point и D1 binding `DB`.

После этого push в `main` будет автоматически пересобирать и публиковать Worker.

## 4. Укажи живой URL API

После первого успешного деплоя Cloudflare покажет адрес примерно:

```text
https://obitel-dead-api.<твой-subdomain>.workers.dev
```

Проверь:

```text
https://obitel-dead-api.<твой-subdomain>.workers.dev/api/health
```

Должен прийти JSON с `ok: true`.

Затем в `config.js` замени только:

```js
const CLOUD_API='https://PASTE-YOUR-WORKER-URL-HERE.workers.dev/api/';
```

на реальный адрес, например:

```js
const CLOUD_API='https://obitel-dead-api.example.workers.dev/api/';
```

Сделай commit + push в `main`.

## 5. Проверка

Открой GitHub Pages и затем Mini App VK.

Нормальное поведение:

- в шапке появляется `СЕРВЕР НА СВЯЗИ · N В СЕТИ`;
- кнопка зачистки активна при достаточной энергии;
- прогресс сохраняется через Worker/D1;
- рейд одного игрока виден другому после добавления в друзья;
- во вкладке «Друзья» есть онлайн-статус, рейтинг и выбор друзей ВК;
- приглашение VK передаёт `friend=<код>` через `request_key`, а при открытии игры создаётся заявка в друзья.

## API

Старые игровые маршруты сохранены:

```text
GET  /api/profile
POST /api/profile
POST /api/run/start
POST /api/run/end
POST /api/weapon
POST /api/armor
POST /api/upgrade
POST /api/daily
POST /api/raids
GET  /api/raids/:id
POST /api/raids/:id/join
POST /api/raids/:id/attack
POST /api/raids/:id/claim
```

Добавлены:

```text
GET  /api/health
GET  /api/online
POST /api/online/ping
GET  /api/leaderboard
GET  /api/friends
POST /api/friends/request
POST /api/friends/accept
POST /api/friends/decline
POST /api/friends/remove
```

## Важно про VK-профиль

Имя из `VKWebAppGetUserInfo` используется как отображаемое имя игрового профиля. Авторитетной игровой сессией остаётся случайный 32-символьный серверный токен. Это не кладёт секреты VK или GitHub в браузер.

Если позже понадобится единый игровой профиль одного VK-пользователя на нескольких устройствах, следующий этап — серверная проверка подписанных launch params VK и привязка `vk_user_id` к профилю в D1. Секрет приложения при этом должен храниться только как Cloudflare Secret, не в GitHub.
