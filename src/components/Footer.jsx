export default function Footer({ text }) {
  return (
    <footer className="foot">
      <p className="giant" aria-hidden="true">nomadx3dg</p>
      <div className="fl">
        <span>{text}</span>
        <span>created november 2026</span>
      </div>
    </footer>
  );
}
