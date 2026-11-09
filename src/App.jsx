import React from 'react';
import './styles.css';
import { NXMusic } from './lib/music';
import {
  BIO, POKE_TEXT, TICKER_WORDS, SONG_TITLE, TRACK, MELODY_SEED,
  GH_USER, GH_DAYS, GH_MAX_REPOS, GH_POLL, GH_KEY
} from './config';
import { pad2, mmss, clockText, utcLabel, dayPartOf, plural, ago } from './lib/format';
import Header from './components/Header';
import Title from './components/Title';
import Player from './components/Player';
import Skills from './components/Skills';
import Socials from './components/Socials';
import Stage from './components/Stage';
import Ticker from './components/Ticker';
import About from './components/About';
import FindMe from './components/FindMe';
import GithubCard from './components/GithubCard';
import RightNow from './components/RightNow';
import Session from './components/Session';
import Visits from './components/Visits';
import Footer from './components/Footer';

// Audio, GitHub polling and drag logic live in this class; the markup is in ./components.

export default class App extends React.Component {
  constructor(props) {
    super(props);
    this.drag = null;
    this.t0 = Date.now();
    this.timer = null;
    this.bytes = MELODY_SEED;
    this.ac = null;
    this.eng = null;
    this.sched = null;
    this.startT = 0;
    this.nextStep = 0;
    this.el = null;
    this.fileBuf = null;
    this.srcNode = null;
    this.fileT0 = 0;
    this.loading = false;
    this.wantPlay = false;
    this.userPaused = false;
    this.autoHandler = null;
    this.ghSig = '';
    this.ghBusy = false;
    this.ghBlock = 0;
    this.ghTimer = null;
    this.onVis = null;
    this.pendingSeek = 0;
    this.pointerSeek = false;
    this.scrubVal = null;
    this.mode = TRACK ? 'file' : 'synth';
    this.state = {
      tick: Date.now(),
      playing: false,
      idx: -1,
      pos: 0,
      dur: 0,
      song: false,
      gh: null,
      ghAt: 0,
      ghStatus: 'loading',
      msg: '',
      noteMidi: -1,
      audioErr: false,
      visits: 1,
      ms: null,
      scrub: null,
      dragId: null,
      mv: { av: { x: 0, y: 0 }, bd: { x: 0, y: 0 } }
    };
  }

  componentDidMount() {
    this.wantPlay = true;
    this.armAuto();
    if (this.mode === 'synth') this.startSynth();
    if (this.mode === 'file') { try { if (this.getAC()) this.loadFile(); } catch (err) {} }
    this.timer = setInterval(() => this.setState({ tick: Date.now() }), 1000);
    this.ghStart();
    try {
      const v = (parseInt(localStorage.getItem('nx_visits') || '0', 10) || 0) + 1;
      localStorage.setItem('nx_visits', String(v));
      this.setState({ visits: v });
    } catch (err) {}
    try {
      const n = performance.getEntriesByType('navigation')[0];
      if (n && n.responseEnd > 0) this.setState({ ms: Math.round(n.responseEnd - n.startTime) });
    } catch (err) {}
  }

  componentWillUnmount() {
    if (this.timer) clearInterval(this.timer);
    if (this.sched) clearInterval(this.sched);
    clearTimeout(this.msgT);
    this.disarmAuto();
    if (this.ghTimer) clearInterval(this.ghTimer);
    if (this.onVis) document.removeEventListener('visibilitychange', this.onVis);
    if (this.el) { try { this.el.pause(); } catch (err) {} }
    if (this.ac) { try { this.ac.close(); } catch (err) {} }
  }

  togglePlay() {
    if (this.state.playing) { this.userPaused = true; this.pauseAudio(); }
    else { this.userPaused = false; this.startAudio(); }
  }

  ghStart() {
    try {
      const c = JSON.parse(localStorage.getItem(GH_KEY) || 'null');
      if (c && c.gh && Array.isArray(c.gh.days)) this.setState({ gh: c.gh, ghAt: c.ghAt || 0, ghStatus: 'cached' });
    } catch (err) {}
    this.ghRefresh(true);
    this.ghTimer = setInterval(() => { if (!document.hidden) this.ghRefresh(false); }, GH_POLL);
    this.onVis = () => { if (!document.hidden) this.ghRefresh(false); };
    document.addEventListener('visibilitychange', this.onVis);
  }

  ghFetch(path) {
    return fetch('https://api.github.com' + path, { headers: { Accept: 'application/vnd.github+json' } }).then((r) => {
      if (r.status === 403 || r.status === 429) {
        const reset = (parseInt(r.headers.get('x-ratelimit-reset') || '0', 10) || 0) * 1000;
        const wait = (parseInt(r.headers.get('retry-after') || '0', 10) || 0) * 1000;
        const e = new Error('limited');
        e.until = Date.now() + Math.min(900000, Math.max(60000, wait || reset - Date.now()));
        throw e;
      }
      if (!r.ok) { const e = new Error('HTTP ' + r.status); e.status = r.status; throw e; }
      return r.json();
    });
  }

  ghRefresh(force) {
    if (this.ghBusy || Date.now() < this.ghBlock) return;
    this.ghBusy = true;
    const day0 = new Date(); day0.setHours(0, 0, 0, 0);
    const since = new Date(day0.getFullYear(), day0.getMonth(), day0.getDate() - (GH_DAYS - 1));
    this.ghFetch('/users/' + GH_USER + '/repos?per_page=100&sort=pushed')
      .then((repos) => {
        const sig = repos.map((r) => r.full_name + r.pushed_at).join('|');
        if (!force && sig === this.ghSig && this.state.gh) { this.setState({ ghStatus: 'live', ghAt: Date.now() }); return null; }
        const pick = repos.filter((r) => r.pushed_at && Date.parse(r.pushed_at) >= since.getTime()).slice(0, GH_MAX_REPOS);
        return Promise.all(pick.map((r) => this.ghFetch('/repos/' + r.full_name + '/commits?author=' + GH_USER + '&since=' + encodeURIComponent(since.toISOString()) + '&per_page=100')
          .catch((e) => { if (e.status === 409) return []; throw e; })))
          .then((lists) => {
            const days = new Array(GH_DAYS).fill(0);
            const seen = {};
            let total = 0, capped = false;
            lists.forEach((list) => {
              if (list.length >= 100) capped = true;
              list.forEach((c) => {
                if (!c || !c.sha || seen[c.sha]) return;
                seen[c.sha] = 1;
                const meta = c.commit && (c.commit.author || c.commit.committer);
                const t = meta ? Date.parse(meta.date) : NaN;
                if (isNaN(t)) return;
                const d = new Date(t);
                const k = Math.round((day0.getTime() - new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()) / 86400000);
                if (k >= 0 && k < GH_DAYS) { days[GH_DAYS - 1 - k]++; total++; }
              });
            });
            const last = repos.reduce((m, r) => Math.max(m, r.pushed_at ? Date.parse(r.pushed_at) : 0), 0);
            const gh = { repos: repos.length, capped: capped, commits: total, days: days, last: last };
            this.ghSig = sig;
            const at = Date.now();
            this.setState({ gh: gh, ghAt: at, ghStatus: 'live' });
            try { localStorage.setItem(GH_KEY, JSON.stringify({ gh: gh, ghAt: at })); } catch (err) {}
          });
      })
      .catch((err) => {
        if (err && err.until) { this.ghBlock = err.until; this.setState({ ghStatus: 'limited' }); }
        else this.setState({ ghStatus: 'offline' });
      })
      .then(() => { this.ghBusy = false; });
  }

  armAuto() {
    if (this.autoHandler) return;
    const skip = { Shift: 1, Control: 1, Alt: 1, Meta: 1, Escape: 1 };
    this.autoHandler = (e) => {
      if (this.state.playing || this.userPaused) { this.disarmAuto(); return; }
      if (e.type === 'keydown' && skip[e.key]) return;
      if (e.target && e.target.closest && e.target.closest('.play')) return;
      this.startAudio();
    };
    ['pointerup', 'click', 'touchend', 'keydown'].forEach((ev) => window.addEventListener(ev, this.autoHandler, true));
  }

  disarmAuto() {
    if (!this.autoHandler) return;
    ['pointerup', 'click', 'touchend', 'keydown'].forEach((ev) => window.removeEventListener(ev, this.autoHandler, true));
    this.autoHandler = null;
  }

  trackName() { return String(TRACK || '').split('/').pop(); }

  getAC() {
    if (this.ac) return this.ac;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) { this.setState({ audioErr: true }); return null; }
    try { if (navigator.audioSession) navigator.audioSession.type = 'playback'; } catch (err) {}
    try { this.ac = new AC(); } catch (err) { this.setState({ audioErr: true }); return null; }
    return this.ac;
  }

  flash(msg, ms) {
    this.setState({ msg: msg });
    clearTimeout(this.msgT);
    if (ms) this.msgT = setTimeout(() => this.setState({ msg: '' }), ms);
  }

  startAudio() {
    this.wantPlay = true;
    if (this.mode === 'synth') { this.startSynth(); return; }
    this.startFile();
  }

  startFile() {
    const ac = this.getAC();
    if (!ac) { this.giveUp('synth'); return; }
    try { ac.resume(); } catch (err) {}
    if (this.fileBuf) { this.playBuf(); return; }
    if (this.el) { this.playEl(); return; }
    if (!this.loading) this.loadFile();
    else this.flash('loading ' + this.trackName() + '...');
  }

  decode(ab) {
    const ac = this.getAC();
    return new Promise((res, rej) => {
      try {
        const p = ac.decodeAudioData(ab, res, rej);
        if (p && p.catch) p.catch(rej);
      } catch (err) { rej(err); }
    }).catch(() => { const e = new Error('decode'); e.kind = 'decode'; throw e; });
  }

  loadFile() {
    this.loading = true;
    this.flash('loading ' + this.trackName() + '...');
    fetch(TRACK)
      .then((r) => {
        if (!r.ok) { const e = new Error('HTTP ' + r.status); e.kind = r.status === 404 ? 'missing' : 'http'; throw e; }
        return r.arrayBuffer();
      })
      .then((ab) => this.decode(ab))
      .then((buf) => {
        this.loading = false;
        this.fileBuf = buf;
        this.flash('', 0);
        this.setState({ dur: buf.duration, song: true });
        if (this.wantPlay) this.playBuf();
      })
      .catch((err) => {
        this.loading = false;
        console.warn('[nomadx3dg] ' + TRACK + ': ' + (err && (err.kind || err.message)));
        if (err && (err.kind === 'missing' || err.kind === 'decode')) this.giveUp(err.kind);
        else this.tryElement();
      });
  }

  playBuf() {
    const ac = this.ac;
    const go = () => {
      if (!this.srcNode) {
        this.startSrc(this.pendingSeek || 0);
        this.pendingSeek = 0;
      }
      this.setState({ playing: true, audioErr: false });
      this.runPump(() => this.pumpBuf());
    };
    if (ac.state === 'running') { go(); return; }
    const p = ac.resume();
    if (p && p.then) p.then(() => { if (this.wantPlay && ac.state === 'running') go(); }, () => this.armAuto());
    else go();
  }

  startSrc(offset) {
    const ac = this.ac;
    const src = ac.createBufferSource();
    src.buffer = this.fileBuf;
    src.loop = true;
    const g = ac.createGain();
    g.gain.value = 0.9;
    src.connect(g); g.connect(ac.destination);
    src.start(0, offset);
    this.srcNode = src;
    this.fileT0 = ac.currentTime - offset;
  }

  pumpBuf() {
    const ac = this.ac, buf = this.fileBuf;
    if (!ac || !buf) return;
    const heard = Math.max(0, ac.currentTime - (ac.outputLatency || 0) - this.fileT0);
    this.showPos(heard % buf.duration, buf.duration);
  }

  tryElement() {
    if (!this.el) {
      const a = new Audio();
      a.preload = 'auto';
      a.loop = true;
      a.src = TRACK;
      a.addEventListener('error', () => this.giveUp('unsupported'));
      a.addEventListener('loadedmetadata', () => { this.flash('', 0); this.setState({ dur: isFinite(a.duration) ? a.duration : 0, song: true }); });
      this.el = a;
    }
    if (this.wantPlay) this.playEl();
  }

  playEl() {
    const a = this.el;
    if (this.pendingSeek) { try { a.currentTime = this.pendingSeek; } catch (err) {} this.pendingSeek = 0; }
    const p = a.play();
    const begin = () => { this.setState({ playing: true, audioErr: false }); this.runPump(() => this.pumpEl()); };
    if (p && p.then) {
      p.then(begin, (err) => {
        if (err && err.name === 'NotAllowedError') this.armAuto();
        else this.giveUp('unsupported');
      });
    } else begin();
  }

  pumpEl() {
    const a = this.el;
    if (!a) return;
    const dur = isFinite(a.duration) && a.duration > 0 ? a.duration : 0;
    this.showPos(a.currentTime || 0, dur);
  }

  showPos(pos, dur) {
    const idx = dur ? Math.min(31, Math.floor(pos / dur * 32)) : 0;
    this.setState({ idx: idx, pos: pos, dur: dur, noteMidi: -1 });
  }

  runPump(fn) {
    if (this.sched) clearInterval(this.sched);
    this.sched = setInterval(fn, 100);
    fn();
  }

  giveUp(kind) {
    if (this.mode === 'synth') return;
    const n = this.trackName();
    const msg = kind === 'missing' ? n + ' not found, synth'
      : kind === 'decode' ? n + ' unreadable, synth'
      : n + ' failed, synth';
    this.mode = 'synth';
    this.pendingSeek = 0;
    this.loading = false;
    if (this.el) { try { this.el.pause(); } catch (err) {} this.el = null; }
    if (this.sched) { clearInterval(this.sched); this.sched = null; }
    this.flash(msg, 7000);
    this.setState({ playing: false, idx: -1, pos: 0, dur: 0, song: false });
    if (this.wantPlay) this.startSynth();
  }

  startSynth() {
    const ac = this.getAC();
    if (!ac) return;
    if (!this.eng) {
      try { this.eng = NXMusic.create(ac, this.bytes); } catch (err) { this.setState({ audioErr: true }); return; }
      this.nextStep = 0;
      this.startT = -1;
    }
    const begin = () => {
      if (ac.state !== 'running') return;
      if (this.startT < 0) {
        this.startT = ac.currentTime + 0.12;
        if (this.pendingSeek) { const t = this.pendingSeek; this.pendingSeek = 0; this.seekSynth(t); }
      }
      this.setState({ playing: true, audioErr: false });
      this.runPump(() => this.pump());
    };
    const p = ac.resume();
    if (p && p.then) p.then(begin, () => this.setState({ audioErr: true }));
    else begin();
  }

  // ---- seeking -------------------------------------------------------------

  trackLength() { return (this.mode !== 'synth' && this.state.dur) ? this.state.dur : NXMusic.TOTAL; }

  seek(t) {
    const total = this.trackLength();
    t = Math.max(0, Math.min(total - 0.05, t));
    if (this.mode === 'synth') this.seekSynth(t);
    else if (this.el) { try { this.el.currentTime = t; } catch (err) {} }
    else if (this.fileBuf && this.srcNode) this.seekBuf(t);
    else this.pendingSeek = t;
    this.setState({ idx: Math.min(31, Math.floor(t / total * 32)), pos: t });
  }

  seekBuf(t) {
    try { this.srcNode.stop(); this.srcNode.disconnect(); } catch (err) {}
    this.srcNode = null;
    this.startSrc(Math.min(t, this.fileBuf.duration - 0.01));
  }

  seekSynth(t) {
    const ac = this.ac;
    if (!ac || !this.eng) { this.pendingSeek = t; return; }
    try { this.eng.stop(); } catch (err) {}
    try { this.eng = NXMusic.create(ac, this.bytes); } catch (err) { this.setState({ audioErr: true }); return; }
    const now = ac.currentTime;
    this.startT = now + 0.12 - t;
    this.nextStep = Math.floor(t / this.eng.stepDur);
    this.eng.enterAt(this.nextStep, now + 0.05);
  }

  // Slider events: while the pointer is down the thumb follows the finger and the seek
  // is applied on release; keyboard changes seek straight away.
  scrubStart() {
    this.pointerSeek = true;
    this.scrubVal = null;
  }

  scrubChange(v) {
    if (this.pointerSeek) { this.scrubVal = v; this.setState({ scrub: v }); }
    else this.seek(v);
  }

  // Keyboard: +/- seconds, or +/-Infinity for the start / end.
  nudge(delta) {
    const cur = this.state.idx < 0 ? 0 : this.state.pos;
    this.seek(delta === -Infinity ? 0 : delta === Infinity ? this.trackLength() : cur + delta);
  }

  scrubEnd() {
    if (!this.pointerSeek) return;
    this.pointerSeek = false;
    const v = this.scrubVal;
    this.scrubVal = null;
    if (v !== null) this.seek(v);
    this.setState({ scrub: null });
  }

  pauseAudio() {
    this.wantPlay = false;
    if (this.sched) { clearInterval(this.sched); this.sched = null; }
    if (this.el) { try { this.el.pause(); } catch (err) {} }
    if (this.ac && !this.el) { try { this.ac.suspend(); } catch (err) {} }
    this.setState({ playing: false });
  }

  pump() {
    const ac = this.ac, eng = this.eng;
    if (!ac || !eng) return;
    const now = ac.currentTime;
    while (this.startT + this.nextStep * eng.stepDur < now + 0.9) {
      eng.step(this.nextStep, this.startT + this.nextStep * eng.stepDur);
      this.nextStep++;
    }
    const heard = now - (ac.outputLatency || ac.baseLatency || 0) - this.startT;
    if (heard < 0) return;
    const n = Math.floor(heard / eng.stepDur);
    const ls = n % eng.loopSteps;
    const m = eng.melody[ls];
    const pos = heard % eng.total;
    this.setState({ idx: ls % eng.stepsPerPass, pos: pos, noteMidi: m && m.gate ? m.midi : -1 });
  }

  dragLimits(e, id, cur) {
    const el = e.currentTarget;
    const stage = el.parentElement;
    const sr = stage.getBoundingClientRect();
    const er = el.getBoundingClientRect();
    const frac = id === 'av' ? [0.37, 0.29] : [0.45, 0.37];
    let lx = sr.width * frac[0], ly = sr.height * frac[1];
    const vw = document.documentElement.clientWidth;
    const baseL = er.left - cur.x, baseR = er.right - cur.x;
    const minX = Math.max(-lx, 6 - baseL);
    const maxX = Math.min(lx, vw - 6 - baseR);
    return { minX: Math.min(minX, 0), maxX: Math.max(maxX, 0), ly: ly };
  }

  dragStart(e, id) {
    if (e.button !== undefined && e.button !== 0) return;
    const cur = this.state.mv[id];
    this.drag = { id: id, sx: e.clientX, sy: e.clientY, ox: cur.x, oy: cur.y };
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch (err) {}
    this.setState({ dragId: id });
  }

  dragMove(e, id) {
    const d = this.drag;
    if (!d || d.id !== id) return;
    const L = this.dragLimits(e, id, this.state.mv[id]);
    const x = Math.max(L.minX, Math.min(L.maxX, d.ox + e.clientX - d.sx));
    const y = Math.max(-L.ly, Math.min(L.ly, d.oy + e.clientY - d.sy));
    this.setState({ mv: { ...this.state.mv, [id]: { x: x, y: y } } });
  }

  dragEnd(e, id) {
    if (!this.drag || this.drag.id !== id) return;
    this.drag = null;
    try { e.currentTarget.releasePointerCapture(e.pointerId); } catch (err) {}
    this.setState({ dragId: null });
  }

  dragKey(e, id) {
    const step = e.shiftKey ? 32 : 12;
    const moves = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
    const m = moves[e.key];
    if (!m) return;
    e.preventDefault();
    const cur = this.state.mv[id];
    const L = this.dragLimits(e, id, cur);
    const x = Math.max(L.minX, Math.min(L.maxX, cur.x + m[0]));
    const y = Math.max(-L.ly, Math.min(L.ly, cur.y + m[1]));
    this.setState({ mv: { ...this.state.mv, [id]: { x: x, y: y } } });
  }

  render() {
    const s = this.state;
    const now = new Date(s.tick);
    const time = clockText(now);
    const utc = utcLabel(now);

    const up = Math.max(0, Math.floor((s.tick - this.t0) / 1000));
    const upLong = pad2(Math.floor(up / 3600)) + ':' + pad2(Math.floor((up % 3600) / 60)) + ':' + pad2(up % 60);
    const upShort = pad2(Math.floor(up / 60)) + ':' + pad2(up % 60);
    const filled = Math.min(60, up);
    const sessionBars = Array.from({ length: 60 }, (_, i) => ({ cls: i >= 60 - filled ? 'sb on' : 'sb' }));

    let pSub = 'nomadx3dg';
    if (s.msg) pSub = s.msg;
    if (s.audioErr) pSub = 'audio unavailable here';
    const total = this.trackLength();
    const position = s.scrub !== null ? s.scrub : (s.idx < 0 ? 0 : s.pos);

    const variants = ['w b1', 'w b1', 'w o1', 'w o1'];
    const half = [];
    for (let k = 0; k < 3; k++) {
      ['nomadx3dg'].concat(TICKER_WORDS).forEach((w, i) => {
        half.push({ t: w, cls: variants[i % variants.length] });
        half.push({ t: '✦', cls: 'st' });
      });
    }

    const g = s.gh;
    const peak = g ? Math.max(1, Math.max.apply(null, g.days)) : 1;
    const ghBars = (g ? g.days : new Array(GH_DAYS).fill(0)).map((n) => ({
      cls: n > 0 ? 'cb on' : 'cb',
      height: (n > 0 ? Math.max(14, Math.round(n / peak * 100)) : 5) + '%'
    }));
    const ghStatus = s.ghStatus === 'live' ? 'live, synced ' + ago(s.tick - s.ghAt) + ' ago'
      : s.ghStatus === 'cached' ? 'showing saved data, connecting'
      : s.ghStatus === 'limited' ? 'rate limited, retrying soon'
      : s.ghStatus === 'offline' ? 'offline, showing last data'
      : 'connecting to GitHub';

    const drag = {
      start: (e, id) => this.dragStart(e, id),
      move: (e, id) => this.dragMove(e, id),
      end: (e, id) => this.dragEnd(e, id),
      key: (e, id) => this.dragKey(e, id)
    };

    return (
      <div className="root" data-canvas-width="1280" data-canvas-height="2400" data-document-role="page" data-label="nomadx3dg">
        <Header time={time} utc={utc} ms={s.ms} />

        <div className="wrap">
          <section id="top">
            <Title />
            <div className="hero-grid">
              <div className="hl">
                <p className="sub"><span className="tag">{BIO}.</span> {POKE_TEXT}</p>
                <Player
                  playing={s.playing}
                  title={SONG_TITLE}
                  sub={pSub}
                  label={s.playing ? 'Pause' : 'Play ' + SONG_TITLE}
                  position={position}
                  length={total}
                  scrubbing={s.scrub !== null}
                  onToggle={() => this.togglePlay()}
                  onScrubStart={() => this.scrubStart()}
                  onScrub={(v) => this.scrubChange(v)}
                  onScrubEnd={() => this.scrubEnd()}
                  onNudge={(d) => this.nudge(d)}
                />
                <Skills />
                <Socials />
              </div>
              <Stage mv={s.mv} dragId={s.dragId} drag={drag} />
            </div>
          </section>
        </div>

        <Ticker items={half.concat(half)} />

        <div className="wrap">
          <div className="sec g2">
            <About />
            <FindMe />
          </div>

          <div className="sec">
            <GithubCard
              repos={g ? String(g.repos) + (g.repos >= 100 ? '+' : '') : '-'}
              repoLabel={g && g.repos === 1 ? 'public repo' : 'public repos'}
              commits={g ? String(g.commits) + (g.capped ? '+' : '') : '-'}
              commitLabel={g && g.commits === 1 && !g.capped ? 'commit, 30 days' : 'commits, 30 days'}
              last={g && g.last ? ago(s.tick - g.last) : '-'}
              bars={ghBars}
              aria={g ? plural(g.commits, 'commit') + ' in the last ' + GH_DAYS + ' days' : 'commit activity loading'}
              dotCls={'gdot' + (s.ghStatus === 'live' ? ' live' : s.ghStatus === 'limited' || s.ghStatus === 'offline' ? ' warn' : '')}
              status={ghStatus}
              active={g ? plural(g.days.filter((n) => n > 0).length, 'active day') : ''}
            />
          </div>

          <div className="sec g2">
            <RightNow
              time={time}
              utc={utc}
              dayPart={dayPartOf(now.getHours())}
              view={(window.innerWidth || 0) + ' x ' + (window.innerHeight || 0) + ' px'}
            />
            <Session short={upShort} long={upLong} bars={sessionBars} />
          </div>

          <div className="sec">
            <Visits count={s.visits} />
          </div>

          <Footer text={'nomadx3dg >> ' + BIO.toLowerCase()} />
        </div>
      </div>
    );
  }
}
