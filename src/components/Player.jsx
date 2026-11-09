import cover from '../assets/img/image-2.jpg';

import { mmss } from '../lib/format';

// Seek position (in seconds) under the pointer.
function valueAt(e, length) {
  const r = e.currentTarget.getBoundingClientRect();
  const ratio = r.width ? (e.clientX - r.left) / r.width : 0;
  return Math.max(0, Math.min(1, ratio)) * length;
}

export default function Player({ playing, title, sub, label, position, length, scrubbing, onToggle, onScrubStart, onScrub, onScrubEnd, onNudge }) {
  const pos = Math.max(0, Math.min(length, position));
  const fill = (length ? pos / length * 100 : 0).toFixed(1) + '%';
  return (
    <div className="card player">
      <div className="p-top">
        <span className={'cover' + (playing ? ' on' : '')} aria-hidden="true">
          <span className="cv-n">N</span>
          <img className="cv-img" src={cover} alt="" />
        </span>
        <div className="p-meta"><span className="p-title">{title}</span><span className="p-sub">{sub}</span></div>
        <button className="play" type="button" aria-label={label} onClick={onToggle}>
          {playing ? (
            <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
              <rect x="2" y="1" width="3" height="10" fill="currentColor" />
              <rect x="7" y="1" width="3" height="10" fill="currentColor" />
            </svg>
          ) : (
            <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
              <path d="M3 1.5 L10.5 6 L3 10.5 Z" fill="currentColor" />
            </svg>
          )}
        </button>
      </div>
      <div className="p-time">
        <span>{mmss(pos)}</span>
        <div
          className={'p-seek' + (scrubbing ? ' scrubbing' : '')}
          role="slider"
          tabIndex={0}
          aria-label="Seek"
          aria-valuemin={0}
          aria-valuemax={Math.round(length)}
          aria-valuenow={Math.round(pos)}
          aria-valuetext={mmss(pos) + ' of ' + mmss(length)}
          onPointerDown={(e) => {
            if (e.pointerType === 'mouse' && e.button !== 0) return;
            e.currentTarget.setPointerCapture(e.pointerId);
            onScrubStart();
            onScrub(valueAt(e, length));
          }}
          onPointerMove={(e) => {
            if (e.currentTarget.hasPointerCapture(e.pointerId)) onScrub(valueAt(e, length));
          }}
          onPointerUp={onScrubEnd}
          onPointerCancel={onScrubEnd}
          onKeyDown={(e) => {
            const step = { ArrowLeft: -1, ArrowDown: -1, ArrowRight: 1, ArrowUp: 1, PageDown: -5, PageUp: 5 }[e.key];
            if (step) { e.preventDefault(); onNudge(step); }
            else if (e.key === 'Home') { e.preventDefault(); onNudge(-Infinity); }
            else if (e.key === 'End') { e.preventDefault(); onNudge(Infinity); }
          }}
        >
          <div className="p-bar"><div className="p-fill" style={{ width: fill }} /></div>
          <i className="p-knob" style={{ left: fill }} />
        </div>
        <span>{mmss(length)}</span>
      </div>
    </div>
  );
}
