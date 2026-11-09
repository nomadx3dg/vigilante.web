import avatar from '../assets/img/image-1.jpg';
import { RING_TEXT } from '../config';

function dragProps(id, drag) {
  return {
    onPointerDown: (e) => drag.start(e, id),
    onPointerMove: (e) => drag.move(e, id),
    onPointerUp: (e) => drag.end(e, id),
    onPointerCancel: (e) => drag.end(e, id),
    onKeyDown: (e) => drag.key(e, id)
  };
}

const pos = (m) => ({ transform: 'translate(' + m.x + 'px,' + m.y + 'px)' });

export default function Stage({ mv, dragId, drag }) {
  return (
    <div className="stage">
      <svg className="ring" viewBox="0 0 400 400" aria-hidden="true">
        <defs><path id="nxcirc" d="M200,200 m-165,0 a165,165 0 1,1 330,0 a165,165 0 1,1 -330,0" /></defs>
        <text><textPath href="#nxcirc" textLength="1030" lengthAdjust="spacing">{RING_TEXT}</textPath></text>
      </svg>
      <button className={'av' + (dragId === 'av' ? ' dragging' : '')} type="button" style={pos(mv.av)} aria-label="Avatar. Drag it, or use the arrow keys." {...dragProps('av', drag)}>
        <img src={avatar} alt="" draggable="false" />
      </button>
      <button className={'badge' + (dragId === 'bd' ? ' dragging' : '')} type="button" style={pos(mv.bd)} aria-label="Badge. Drag it, or use the arrow keys." {...dragProps('bd', drag)}>
        {'>_'}
      </button>
    </div>
  );
}
