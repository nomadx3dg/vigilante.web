// Site content and constants. Edit things here.

export const HANDLE = 'nomadx3dg';
export const BIO = 'the future is in Claude and my hand';
export const POKE_TEXT = 'Poke around: press play, drag the avatar.';

// Words shown in the scrolling ticker (the handle is added in front).
export const TICKER_WORDS = ['C++', 'Rust', BIO];

// Text that runs around the avatar ring.
export const RING_TEXT = 'NOMADX3DG · C++ · RUST · THE FUTURE IS IN CLAUDE AND MY HAND · ';

// "Find me" links. A link with `copy` copies that text when clicked instead of opening `href`.
// `icon` is a key of BRAND_ICONS in src/lib/brands.js.
export const LINKS = [
  { id: 'github', icon: 'github', name: '@nomadx3dg', platform: 'github', href: 'https://github.com/nomadx3dg' },
  { id: 'tiktok', icon: 'tiktok', name: '@nomadx3dg', platform: 'tiktok', href: 'https://www.tiktok.com/@nomadx3dg' },
  { id: 'discord', icon: 'discord', name: '3letters._', platform: 'discord', copy: '3letters._' }
];

export const SKILLS = [
  { name: 'C++', icon: 'cpp' },
  { name: 'Rust', icon: 'rust' },
  { name: 'C', icon: 'c' },
  { name: 'Python', icon: 'python' },
  { name: 'Go', icon: 'go' },
  { name: 'SQL', icon: 'sql' },
  { name: BIO, icon: 'spark' }
];

export const SONG_TITLE = 'bedrot';

// Audio file played by the player. If it is missing, the built-in synth plays instead.
// Put your file in the `public` folder to use it.
export const TRACK = 'music.wav';

// Seed that shapes the generated melody (kept so the synth tune stays the same).
export const MELODY_SEED = [67, 43, 43, 32, 97, 110, 100, 32, 82, 117, 115, 116, 44, 32, 116, 104, 101, 32, 102, 117, 116, 117, 114, 101, 32, 105, 115, 32, 105, 110, 32, 67, 108, 97, 117, 100, 101, 32, 97, 110, 100, 32, 109, 121, 32, 104, 97, 110, 100];

// GitHub activity card
export const GH_USER = 'nomadx3dg';
export const GH_DAYS = 30;
export const GH_MAX_REPOS = 8;
export const GH_POLL = 60000;
export const GH_KEY = 'nx_gh';
