import logo from '../assets/img/image-1.jpg';

export default function Header({ time, utc, ms }) {
  return (
    <header className="top">
      <div className="top-in">
        <a className="brand" href="#top" aria-label="nomadx3dg, back to top">
          <span className="logo" aria-hidden="true"><img src={logo} alt="" /></span>
          <span>nomadx3dg<span className="dim">~</span></span>
        </a>
        <span className="pill mono">
          {time} <span className="dim">{utc}</span>
          {ms !== null && <span className="dim ms">· {ms} ms</span>}
        </span>
      </div>
    </header>
  );
}
