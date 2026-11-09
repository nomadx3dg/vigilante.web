export default function Session({ short, long, bars }) {
  return (
    <div className="card">
      <h2 className="lab">This session</h2>
      <div className="clock"><span>{short}</span></div>
      <div className="bars" aria-hidden="true">
        {bars.map((b, i) => <span className={b.cls} key={i} />)}
      </div>
      <div className="bl" aria-hidden="true"><span>60 s ago</span><span>now</span></div>
      <div className="krow"><span>on this page</span><b>{long}</b></div>
    </div>
  );
}
