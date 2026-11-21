export const MENU_PHOTOS = [
  "/img/philadelphia.webp",
  "/img/california.webp",
  "/img/baked.webp",
  "/img/nigiri.webp",
  "/img/maki.webp",
  "/img/shaverma.webp",
  "/img/lyulya.webp",
  "/img/shashlyk.webp",
  "/img/shashlyk-chicken.webp",
  "/img/potato.webp",
  "/img/mushrooms.webp",
  "/img/burger.webp",
  "/img/cheeseburger.webp",
  "/img/baconburger.webp",
];

export function safeImagePath(src: string) {
  const value = String(src || "").trim();
  if (!value) return "";
  if (!/^\/img\/[a-z0-9._-]+\.(webp|jpe?g|png)$/i.test(value)) return null;
  return value;
}
