export default function RightNow({ time, utc, dayPart, view }) {
  return (
    <div className="card">
      <h2 className="lab">Right now</h2>
      <div className="clock"><span>{time}</span><span className="z">{utc}</span></div>
      <p className="msg">it is {dayPart} for you</p>
      <p className="msg2">local time, read from your browser</p>
      <div className="krow"><span>screen</span><b>{view}</b></div>
    </div>
  );
}
