<div align="center">

# `nomadx3dg.`

**the future is in Claude and my hand.**

A personal site with a music player, a live GitHub activity card and a title you can play with.

<br />

![React](https://img.shields.io/badge/React-18-61dafb?style=for-the-badge&logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-5-646cff?style=for-the-badge&logo=vite&logoColor=white)
![Node](https://img.shields.io/badge/Node-18%2B-5fa04e?style=for-the-badge&logo=nodedotjs&logoColor=white)
![No backend](https://img.shields.io/badge/backend-none-0a0a0c?style=for-the-badge)

<br />

[Quick start](#quick-start) | [Features](#features) | [Make it yours](#make-it-yours) | [Deploy](#deploy) | [Project map](#project-map)

</div>

<br />

## Features

| Feature | What it does |
|---|---|
| Music player | Plays the track in `public/music.wav` on a loop. The player shows the real track length and elapsed time. |
| Seekable playbar | Drag the handle, tap the bar, or use the keyboard (arrow keys, Page Up, Page Down, Home, End). Seeking works while playing and while paused. |
| Fallback synth | If `music.wav` is missing or cannot be decoded, a small synth built with the Web Audio API plays instead, so the player is never silent. It is a 20-second loop at 96 BPM in A minor, and it is the same tune every time. |
| GitHub activity card | Public repo count, commits from the last 30 days, a daily commit chart and time since the last push, fetched from the GitHub REST API in the visitor's browser. |
| Local clock | The visitor's local time, shown as `21.00`, with their UTC offset. |
| Session and visit counters | Time spent on the page, and a visit count stored in the visitor's browser (`localStorage`). |
| Playful bits | Drag the avatar and badge around, or move them with the arrow keys. On touch screens, slide a finger across the title and the letters lift one by one. With a mouse, they lift on hover. |
| Find me links | A row can open a profile (`href`) or copy text to the clipboard (`copy`). |

<br />

## Quick start

You need [Node.js](https://nodejs.org) 18 or newer, and your track saved as `public/music.wav`.

```bash
git clone https://github.com/nomadx3dg/<repo>.git
cd <repo>

npm install
npm run dev
```

Without `public/music.wav`, the player falls back to the built-in synth.

Open the address it prints, usually <http://localhost:5173>.

| Command | What it does |
|---|---|
| `npm run dev` | Start the dev server with hot reload |
| `npm run build` | Build the site into `dist/` |
| `npm run preview` | Serve the production build locally |

<br />

## Make it yours

Most of the content is in [`src/config.js`](src/config.js): the bio, ticker words, ring text, Find me links, skills, song title, the audio file name and the GitHub settings.

```js
export const BIO = 'the future is in Claude and my hand';

export const LINKS = [
  { id: 'github',  icon: 'github',  name: '@nomadx3dg', platform: 'github',  href: 'https://github.com/nomadx3dg' },
  { id: 'tiktok',  icon: 'tiktok',  name: '@nomadx3dg', platform: 'tiktok',  href: 'https://www.tiktok.com/@nomadx3dg' },
  { id: 'discord', icon: 'discord', name: '3letters._', platform: 'discord', copy: '3letters._' }
];
```

- **Open a link:** give the entry an `href`.
- **Copy text instead:** give it a `copy` value. Clicking the row copies it.
- **Icons:** `icon` is a key from [`src/lib/brands.js`](src/lib/brands.js).
- **Music:** put your audio file in [`public/`](public). The name must match `TRACK` in `src/config.js` (`music.wav` by default), and the title shown in the player is `SONG_TITLE`.
- **GitHub account:** `GH_USER` sets which account the card reads. The `@nomadx3dg` label on that card is plain text in [`src/components/GithubCard.jsx`](src/components/GithubCard.jsx), so change it there too.

A few texts are written directly in the components and are not in `config.js`: the handle and platform in the About card, the header and footer text, and the GitHub button under the intro (`Socials.jsx`).

The GitHub card calls the API without a token, so GitHub's unauthenticated rate limit applies. When it is hit, the card shows a status line and retries. The last result is cached in the browser.

<br />

## Deploy

```bash
npm run build
```

Upload the contents of `dist/` to any static host, such as GitHub Pages, Netlify, Cloudflare Pages or Vercel. There is no server and no environment variables to set. Asset paths are relative, so the site also works from a subfolder.

<br />

## Project map

```text
.
|-- index.html              Vite entry
|-- public/                 static files, including music.wav
`-- src/
    |-- main.jsx            React root
    |-- App.jsx             audio, GitHub polling, drag logic and page layout
    |-- config.js           bio, links, skills, GitHub settings
    |-- styles.css          all CSS
    |-- assets/             images and fonts
    |-- components/         Header, Title, Player, Skills, FindMe, GithubCard, ...
    `-- lib/
        |-- music.js        fallback synth, used when music.wav is missing
        |-- brands.js       brand logo paths
        |-- icons.js        skill icon paths
        |-- format.js       time and number helpers
        `-- copy.js         clipboard helper
```

<br />

## Built with

[React](https://react.dev), [Vite](https://vitejs.dev), the [Web Audio API](https://developer.mozilla.org/docs/Web/API/Web_Audio_API) and the [GitHub REST API](https://docs.github.com/rest). Brand logos for GitHub, TikTok and Discord come from [Simple Icons](https://simpleicons.org).

<br />

<div align="center">

**nomadx3dg**, created november 2026

</div>
