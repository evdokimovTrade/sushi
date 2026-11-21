# Выкат ТаланД на сервер (задача для агента на сервере)

Цель: сайт ТаланД работает по HTTPS за уже запущенным traefik и закрыт паролем стенда. Чужие контейнеры (`openclaw-9w6k-openclaw-1`, `traefik-traefik-1`) не останавливать и не пересоздавать.

## Что нужно от владельца до начала

1. **Домен или поддомен**, и A-запись на IP сервера. Без домена Let's Encrypt не выдаст сертификат.
2. **Пароль стенда**: вводится только в терминале сервера, в чат не пишется.

## Шаги

1. Код: `git clone https://github.com/evdokimovTrade/sushi.git /opt/taland-src && cd /opt/taland-src && git checkout claude/taland-deploy`.
2. Посмотреть настройки traefik, ничего не меняя:
   - `docker inspect traefik-traefik-1 --format '{{json .NetworkSettings.Networks}}'` — имя сети;
   - `docker inspect traefik-traefik-1 --format '{{json .Config.Cmd}} {{json .Args}}'` и файлы конфигурации traefik — имена entrypoint HTTPS и certresolver;
   - сравнить с метками рабочего контейнера: `docker inspect openclaw-9w6k-openclaw-1 --format '{{json .Config.Labels}}'`.
3. `cd taland && cp .env.example .env`, затем в `.env`:
   - `ADMIN_PASSWORD` — новый длинный пароль админки, не `change-me`;
   - `AUTH_MODE=dev` и `ALLOW_MOCK_PAYMENTS=true` оставить: стенд закрыт паролем, денег нет;
   - ключи ЮKassa пустые, пока владелец не даст тестовые.
4. `cd deploy && cp .env.example .env`: заполнить `TALAND_DOMAIN`, сеть, entrypoint и certresolver из шага 2. `TALAND_BASIC_AUTH` сгенерировать командой из комментария; пароль вводит владелец.
5. `docker compose -f deploy/docker-compose.yml --env-file deploy/.env up -d --build` (из папки `taland`).
6. Проверка:
   - `docker logs taland` — строки «Меню записано» и запуск next;
   - `curl -u taland:ПАРОЛЬ https://ДОМЕН/api/health` → 200;
   - без пароля → 401;
   - `docker ps` — openclaw и traefik работают как прежде.
7. В `docs/STATE.md` репозитория ets1-orchestrator записать: домен, где лежит код, как обновлять, где данные (том `taland-data`). Пароли не писать.

## Обновление

`git pull && docker compose -f deploy/docker-compose.yml --env-file deploy/.env up -d --build`. Заказы и меню лежат в томе `taland-data` и при пересборке сохраняются.

## Резервная копия

`docker cp taland:/app/data/taland.db /opt/ets1/backups/taland-$(date +%F).db`, раз в сутки по cron.

## Перед открытием для клиентов (не сейчас)

Нужны четыре вещи, сайт уже умеет их без правки кода:
- SMS-вход (`AUTH_MODE=sms` и шлюз), чтобы код не показывался на экране;
- тестовые, затем боевые ключи ЮKassa и `ALLOW_MOCK_PAYMENTS=false`;
- реквизиты в оферте;
- после этого убрать пароль стенда (строку `middlewares` в compose).
