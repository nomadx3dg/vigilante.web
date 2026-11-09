import { useEffect, useRef, useState } from 'react';
import { LINKS } from '../config';
import { BRAND_ICONS } from '../lib/brands';
import { copyText } from '../lib/copy';

function Badge({ icon }) {
  return (
    <span className="ic" aria-hidden="true">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d={BRAND_ICONS[icon]} /></svg>
    </span>
  );
}

// A row with a `copy` value copies it on click instead of opening a link.
function CopyRow({ link }) {
  const [state, setState] = useState('idle'); // idle | done | fail
  const timer = useRef(0);
  useEffect(() => () => clearTimeout(timer.current), []);

  const onClick = () => {
    copyText(link.copy).then(() => setState('done'), () => setState('fail'));
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setState('idle'), 1800);
  };

  return (
    <button className={'frow copy' + (state === 'done' ? ' done' : '')} type="button" onClick={onClick} aria-label={'Copy ' + link.platform + ' username ' + link.copy}>
      <Badge icon={link.icon} />
      <span className="tx">
        <span className="nm">{link.name}</span>
        <span className="pf" aria-live="polite">
          {state === 'done' ? 'copied to clipboard' : state === 'fail' ? 'copy failed, select it manually' : link.platform + ', tap to copy'}
        </span>
      </span>
      <span className="go" aria-hidden="true">
        {state === 'done' ? (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
        ) : (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="11" height="11" rx="2" /><path d="M5 15V6a2 2 0 0 1 2-2h9" /></svg>
        )}
      </span>
    </button>
  );
}

export default function FindMe() {
  return (
    <div className="card">
      <h2 className="lab">Find me</h2>
      {LINKS.map((l) =>
        l.copy ? (
          <CopyRow link={l} key={l.id} />
        ) : (
          <a className="frow" href={l.href} target="_blank" rel="noopener" key={l.id}>
            <Badge icon={l.icon} />
            <span className="tx"><span className="nm">{l.name}</span><span className="pf">{l.platform}</span></span>
            <span className="go" aria-hidden="true">↗</span>
          </a>
        )
      )}
    </div>
  );
}
