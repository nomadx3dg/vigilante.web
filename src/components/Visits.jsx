export default function Visits({ count }) {
  return (
    <div className="card">
      <h2 className="lab">Your visit</h2>
      <div className="clock"><span>#{count}</span></div>
      <p className="msg2" style={{ marginTop: 14 }}>visits from this browser, counted on your device.</p>
    </div>
  );
}
