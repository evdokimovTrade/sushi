#!/bin/sh
# Запуск ТаланД в контейнере: база в /app/data (том), схема без потери данных, меню при первом старте.
set -e
mkdir -p /app/data
export DATABASE_URL="file:/app/data/taland.db"
FIRST=0
[ -f /app/data/taland.db ] || FIRST=1
# Без --accept-data-loss: если изменение схемы грозит удалить данные, старт остановится, а не сотрёт заказы.
npx prisma db push --skip-generate
if [ "$FIRST" = "1" ]; then
  echo "Первый запуск: записываю меню"
  npx tsx prisma/seed.ts
fi
exec npx next start -p 3000 -H 0.0.0.0
