import Link from "next/link";

export default function HomePage() {
  return (
    <main className="wrap">
      <section className="hero">
        <img className="hero__logo" src="/brand/taland-logo-hero.webp" width={720} height={405} alt="ТаланД" fetchPriority="high" />
        <h1>Вкусно из разных стран — с доставкой по юго-западу Петербурга</h1>
        <p className="hero__sub">Просто вкусно</p>
        <div className="badges">
          <Link className="badge" href="/sushi" data-track="home_chip_sushi">суши</Link>
          <Link className="badge" href="/grill" data-track="home_chip_grill">шашлык</Link>
          <Link className="badge" href="/burgers" data-track="home_chip_burgers">бургеры</Link>
        </div>
        <a className="cta" href="#cats" data-track="home_cta_order">Собрать заказ</a>
      </section>
      <div className="cat-grid" id="cats">
        <Link className="cat-card" href="/sushi" data-track="home_card_sushi">
          <img src="/img/philadelphia.webp" width={800} height={500} alt="" />
          <span className="cat-card__label">Суши</span>
        </Link>
        <Link className="cat-card" href="/grill" data-track="home_card_grill">
          <img src="/img/shashlyk.webp" width={800} height={500} alt="" loading="lazy" decoding="async" />
          <span className="cat-card__label">Шашлык и люля</span>
        </Link>
        <Link className="cat-card" href="/burgers" data-track="home_card_burgers">
          <img src="/img/burger.webp" width={800} height={500} alt="" loading="lazy" decoding="async" />
          <span className="cat-card__label">Бургеры</span>
        </Link>
      </div>
    </main>
  );
}
