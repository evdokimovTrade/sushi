export function Footer() {
  return (
    <footer className="foot">
      <p>ТаланД — магазин всемирных продуктов. Просто вкусно.</p>
      <p className="foot__zones">Доставка: Аннино, Новоселье, Горелово, Красное Село</p>
      <p>Телефон: добавим</p>
      <p className="fine">Цены суши и бургеров — пример. Цены шашлыка — черновик, уточняются. Пороги и стоимость доставки тоже пример, их меняют в админке.</p>
      <p className="foot__links">
        <a href="/account" data-track="footer_account">Личный кабинет</a>
        <a href="/legal/offer" data-track="footer_offer">Оферта</a>
        <a href="/legal/privacy" data-track="footer_privacy">Персональные данные</a>
        <a href="/legal/delivery" data-track="footer_delivery">Доставка и возврат</a>
        <a href="/admin" data-track="footer_staff">Сотрудникам</a>
      </p>
    </footer>
  );
}
