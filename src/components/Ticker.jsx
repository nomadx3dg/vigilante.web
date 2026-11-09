export default function Ticker({ items }) {
  return (
    <div className="ticker" aria-hidden="true">
      <div className="mtrack">
        {items.map((t, i) => <span className={t.cls} key={i}>{t.t}</span>)}
      </div>
    </div>
  );
}
