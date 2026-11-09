import { SKILLS } from '../config';
import { svgUri } from '../lib/icons';

export default function Skills() {
  return (
    <div className="skills">
      {SKILLS.map((s) => (
        <div className="skill" key={s.name}>
          <span className="sk-ic" aria-hidden="true"><img src={svgUri(s.icon)} alt="" /></span>
          <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', lineHeight: 1.3 }}>
            <span className="sk-n">{s.name}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
