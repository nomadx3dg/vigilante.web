import { BIO } from '../config';

export default function About() {
  return (
    <div className="card">
      <h2 className="lab">About</h2>
      <div className="field"><span className="fk">handle</span><span className="fv">nomadx3dg.</span></div>
      <div className="field"><span className="fk">bio</span><span className="fv">{BIO}.</span></div>
      <div className="field"><span className="fk">platform</span><span className="fv">GitHub.</span></div>
    </div>
  );
}
