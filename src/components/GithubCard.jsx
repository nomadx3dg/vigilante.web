export default function GithubCard({ repos, repoLabel, commits, commitLabel, last, bars, aria, dotCls, status, active }) {
  return (
    <div className="card">
      <div className="cardhead"><h2 className="lab">GitHub</h2><span className="r">@nomadx3dg</span></div>
      <div className="g3">
        <div className="tile"><span className="big">{repos}</span><span className="tl">{repoLabel}</span></div>
        <div className="tile"><span className="big">{commits}</span><span className="tl">{commitLabel}</span></div>
        <div className="tile"><span className="big">{last}</span><span className="tl">since last push</span></div>
      </div>
      <div className="cbars" role="img" aria-label={aria}>
        {bars.map((c, i) => <span className={c.cls} style={{ height: c.height }} key={i} />)}
      </div>
      <div className="bl" aria-hidden="true"><span>30 days ago</span><span>today</span></div>
      <div className="krow"><span className="gst"><i className={dotCls} />{status}</span><b>{active}</b></div>
    </div>
  );
}
