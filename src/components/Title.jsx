import { useRef, useState } from 'react';
import { HANDLE } from '../config';

// Mouse: letters lift on hover (CSS). Touch / pen: press and slide a finger across the
// title and every letter under it lifts, no need to tap each one.
export default function Title() {
  const [lift, setLift] = useState(-1);
  const down = useRef(false);

  const letterAt = (e) => {
    const el = document.elementFromPoint(e.clientX, e.clientY);
    const ch = el && el.closest && el.closest('.ch');
    return ch ? Number(ch.dataset.i) : -1;
  };
  const track = (e) => {
    if (e.pointerType === 'mouse' || !down.current) return;
    setLift(letterAt(e));
  };
  const begin = (e) => {
    if (e.pointerType === 'mouse') return;
    down.current = true;
    setLift(letterAt(e));
  };
  const end = () => {
    down.current = false;
    setLift(-1);
  };

  return (
    <h1
      className="title"
      aria-label={HANDLE + '.'}
      onPointerDown={begin}
      onPointerMove={track}
      onPointerUp={end}
      onPointerCancel={end}
    >
      {(HANDLE + '.').split('').map((c, i) => (
        <span className={'ch' + (i === lift ? ' lift' : '')} data-i={i} aria-hidden="true" key={i}>{c}</span>
      ))}
    </h1>
  );
}
