/** Фоновая отправка очереди в Google Таблицу. Подключается только в серверном Node (не edge). */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./instrumentation-node");
  }
}
