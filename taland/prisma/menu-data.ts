/** Меню прототипа. Суши и бургеры — пример цен. Шашлык — черновик кухни. */

export type SeedVariant = { id: string; name: string; price: number };
export type SeedItem = {
  id: string;
  cat: "sushi" | "grill" | "burgers";
  name: string;
  unit?: string;
  img?: string;
  section?: string;
  sectionName?: string;
  layout?: "card" | "compact";
  qtyOnly?: boolean;
  variants: SeedVariant[];
};

export const CATEGORIES = [
  { id: "sushi", name: "Суши", fullName: "Суши", priceNote: "Цены на этой странице — пример, до прайса кухни.", sort: 1 },
  { id: "grill", name: "Шашлык", fullName: "Шашлык и люля", priceNote: "Цены уточняются.", sort: 2 },
  { id: "burgers", name: "Бургеры", fullName: "Бургеры", priceNote: "Цены на этой странице — пример, до прайса кухни.", sort: 3 },
] as const;

export const MENU: SeedItem[] = [
  { id: "phila", cat: "sushi", name: "Филадельфия", unit: "8 шт", img: "/img/philadelphia.webp", variants: [
    { id: "salmon", name: "Лосось", price: 619 },
    { id: "tuna", name: "Тунец", price: 649 },
    { id: "unagi", name: "Угорь", price: 699 },
  ]},
  { id: "cali", cat: "sushi", name: "Калифорния", unit: "8 шт", img: "/img/california.webp", variants: [
    { id: "crab", name: "Краб", price: 549 },
    { id: "salmon", name: "Лосось", price: 579 },
    { id: "unagi", name: "Угорь", price: 629 },
  ]},
  { id: "baked", cat: "sushi", name: "Запечённый ролл", unit: "8 шт", img: "/img/baked.webp", variants: [
    { id: "crab", name: "Краб", price: 549 },
    { id: "salmon", name: "Лосось", price: 589 },
    { id: "unagi", name: "Угорь", price: 639 },
  ]},
  { id: "nigiri", cat: "sushi", name: "Нигири", unit: "2 шт", img: "/img/nigiri.webp", variants: [
    { id: "salmon", name: "Лосось", price: 280 },
    { id: "tuna", name: "Тунец", price: 300 },
    { id: "unagi", name: "Угорь", price: 320 },
  ]},
  { id: "maki", cat: "sushi", name: "Маки", unit: "8 шт", img: "/img/maki.webp", variants: [
    { id: "salmon", name: "Лосось", price: 349 },
    { id: "tuna", name: "Тунец", price: 369 },
    { id: "unagi", name: "Угорь", price: 399 },
  ]},

  { id: "shaverma", cat: "grill", name: "Шаверма", img: "/img/shaverma.webp", variants: [
    { id: "pork", name: "Из свинины", price: 400 },
    { id: "chicken", name: "Из курицы", price: 400 },
    { id: "plate", name: "На тарелке", price: 500 },
  ]},
  { id: "lyulya", cat: "grill", name: "Люля-кебаб", img: "/img/lyulya.webp", variants: [
    { id: "pork", name: "Свинина", price: 400 },
    { id: "chicken", name: "Курица", price: 400 },
  ]},
  { id: "shashlyk-pork", cat: "grill", name: "Шашлык из свинины", img: "/img/shashlyk.webp", variants: [
    { id: "pulp", name: "Мякоть", price: 500 },
    { id: "neck", name: "Шея", price: 600 },
  ]},
  { id: "shashlyk-chicken", cat: "grill", name: "Шашлык из курицы", img: "/img/shashlyk-chicken.webp", variants: [
    { id: "drum", name: "Голень", price: 400 },
    { id: "wings", name: "Крылья", price: 400 },
    { id: "breast", name: "Грудка", price: 500 },
    { id: "thigh", name: "Филе бедра", price: 500 },
  ]},
  { id: "potato", cat: "grill", section: "mangal", sectionName: "С мангала", name: "Картофель", img: "/img/potato.webp", qtyOnly: true, variants: [
    { id: "std", name: "Картофель", price: 150 },
  ]},
  { id: "mushrooms", cat: "grill", section: "mangal", sectionName: "С мангала", name: "Грибы шампиньоны", img: "/img/mushrooms.webp", qtyOnly: true, variants: [
    { id: "std", name: "Грибы шампиньоны", price: 250 },
  ]},
  { id: "sauce-garlic", cat: "grill", section: "extras", sectionName: "Соусы и добавки", name: "Соус чесночный", layout: "compact", qtyOnly: true, variants: [
    { id: "std", name: "Соус чесночный", price: 50 },
  ]},
  { id: "sauce-tomato", cat: "grill", section: "extras", sectionName: "Соусы и добавки", name: "Соус томатный", layout: "compact", qtyOnly: true, variants: [
    { id: "std", name: "Соус томатный", price: 50 },
  ]},
  { id: "lavash", cat: "grill", section: "extras", sectionName: "Соусы и добавки", name: "Лаваш", layout: "compact", qtyOnly: true, variants: [
    { id: "std", name: "Лаваш", price: 50 },
  ]},
  { id: "pickles", cat: "grill", section: "extras", sectionName: "Соусы и добавки", name: "Соленья", layout: "compact", qtyOnly: true, variants: [
    { id: "std", name: "Соленья", price: 200 },
  ]},
  { id: "tea", cat: "grill", section: "drinks", sectionName: "Напитки", name: "Чай", layout: "compact", qtyOnly: true, variants: [
    { id: "std", name: "Чай", price: 60 },
  ]},
  { id: "coffee", cat: "grill", section: "drinks", sectionName: "Напитки", name: "Кофе", layout: "compact", qtyOnly: true, variants: [
    { id: "std", name: "Кофе", price: 100 },
  ]},

  { id: "burger", cat: "burgers", name: "Бургер", unit: "1 шт", img: "/img/burger.webp", variants: [
    { id: "beef", name: "Говядина", price: 390 },
    { id: "chicken", name: "Курица", price: 360 },
    { id: "double", name: "Двойная говядина", price: 520 },
  ]},
  { id: "cheeseburger", cat: "burgers", name: "Чизбургер", unit: "1 шт", img: "/img/cheeseburger.webp", variants: [
    { id: "beef", name: "Говядина", price: 430 },
    { id: "chicken", name: "Курица", price: 400 },
    { id: "double", name: "Двойная говядина", price: 560 },
  ]},
  { id: "baconburger", cat: "burgers", name: "Бургер с беконом", unit: "1 шт", img: "/img/baconburger.webp", variants: [
    { id: "beef", name: "Говядина", price: 450 },
    { id: "chicken", name: "Курица", price: 420 },
    { id: "double", name: "Двойная говядина", price: 590 },
  ]},
];

export function variantKey(itemId: string, variantId: string) {
  return `${itemId}__${variantId}`;
}

export function assertMenuRules(items: SeedItem[] = MENU) {
  const sushi = items.filter((i) => i.cat === "sushi");
  const burgers = items.filter((i) => i.cat === "burgers");
  if (sushi.length > 10) throw new Error("Суши: не больше 10 позиций");
  if (burgers.length !== 3) throw new Error("Бургеров должно быть ровно 3");
  for (const item of items) {
    const n = item.variants.length;
    if (item.cat === "sushi" || item.cat === "burgers") {
      if (item.qtyOnly || n !== 3) throw new Error("Ровно 3 варианта: " + item.id);
    } else if (item.qtyOnly) {
      if (n !== 1) throw new Error("Позиция только с количеством: " + item.id);
    } else if (n < 2 || n > 4) {
      throw new Error("У шашлыка 2–4 варианта: " + item.id);
    }
  }
}

assertMenuRules();

/** Пример. Меняется в админке, повторный seed существующие зоны не затирает. */
export const EXAMPLE_ZONES = [
  { id: "annino", name: "Аннино", minOrder: 800, fee: 0, sort: 1 },
  { id: "novoselye", name: "Новоселье", minOrder: 1000, fee: 150, sort: 2 },
  { id: "gorelovo", name: "Горелово", minOrder: 1000, fee: 200, sort: 3 },
  { id: "krasnoe-selo", name: "Красное Село", minOrder: 1200, fee: 250, sort: 4 },
];

export const EXAMPLE_PROMOS = [
  { code: "TALAND10", type: "percent", value: 10, minOrder: 0, note: "Пример: скидка 10%" },
  { code: "NOVY500", type: "fixed", value: 500, minOrder: 1500, note: "Пример: 500 ₽ при заказе от 1500 ₽" },
];
