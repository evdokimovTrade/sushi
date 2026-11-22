import { flushOutbox } from "./lib/sheets";

// Очередь в Google Таблицу: каждые 15 секунд и через 3 секунды после старта (дослать накопленное, пока сервер был выключен).
const tick = () => flushOutbox().catch((error) => console.error("sheets flush", error));
setInterval(tick, 15000);
setTimeout(tick, 3000);
