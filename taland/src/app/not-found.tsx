export default function NotFound() {
  return (
    <main className="wrap">
      <div className="panel">
        <h2>Страница не найдена</h2>
        <p className="fine">Такой страницы нет.</p>
        <a className="btn btn--main" href="/" style={{ marginTop: 12 }}>На главную</a>
      </div>
    </main>
  );
}
