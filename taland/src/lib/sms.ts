export interface SmsSender {
  send(phone: string, message: string): Promise<void>;
}

/** Подключение своего шлюза: SMS_PROVIDER=http, SMS_HTTP_URL, необязательно SMS_HTTP_TOKEN. */
export function getSmsSender(): SmsSender {
  const provider = (process.env.SMS_PROVIDER || "").trim();
  if (provider === "http") {
    const url = (process.env.SMS_HTTP_URL || "").trim();
    if (!url) throw new Error("Задайте SMS_HTTP_URL");
    const token = (process.env.SMS_HTTP_TOKEN || "").trim();
    return {
      async send(phone, message) {
        const res = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ phone, message }),
        });
        if (!res.ok) throw new Error("SMS-шлюз вернул ошибку");
      },
    };
  }
  throw new Error("SMS-провайдер не подключён. Укажите SMS_PROVIDER=http или оставьте AUTH_MODE=dev.");
}
