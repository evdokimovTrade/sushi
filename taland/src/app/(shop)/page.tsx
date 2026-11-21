import Link from "next/link";

export default function HomePage() {
  return (
    <main className="wrap">
      <section className="hero">
        <img className="hero__logo" src="/brand/taland-logo-dark.png" width={1200} height={675} alt="ТаланД" />
        <h1>Вкусно из разных стран — с доставкой по юго-западу Петербурга</h1>
        <p className="hero__sub">Просто вкусно</p>
        <div className="badges">
          <Link className="badge" href="/sushi">суши</Link>
          <Link className="badge" href="/grill">шашлык</Link>
          <Link className="badge" href="/burgers">бургеры</Link>
        </div>
        <a className="cta" href="#cats">Собрать заказ</a>
      </section>
      <div className="cat-grid" id="cats">
        <Link className="cat-card" href="/sushi">
          <img src="/img/philadelphia.webp" alt="" />
          <span className="cat-card__label">Суши</span>
        </Link>
        <Link className="cat-card" href="/grill">
          <img src="/img/shashlyk.webp" alt="" />
          <span className="cat-card__label">Шашлык и люля</span>
        </Link>
        <Link className="cat-card" href="/burgers">
          <img src="/img/burger.webp" alt="" />
          <span className="cat-card__label">Бургеры</span>
        </Link>
      </div>
    </main>
  );
}
