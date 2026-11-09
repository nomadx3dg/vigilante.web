# nomadx3dg (React)

React + Vite version of the site.

## Run it

You need Node.js 18 or newer (https://nodejs.org).

```
npm install
npm run dev
```

Open the address it prints (usually http://localhost:5173).

## Build for hosting

```
npm run build
```

Upload the contents of the `dist` folder to any static host (GitHub Pages, Netlify, Cloudflare Pages).
You can also test the build locally with `npm run preview`.

## Where things are

- `src/config.js` - bio, ticker words, "Find me" links, skills, GitHub settings
- `src/App.jsx` - audio player, GitHub activity and drag logic, and the page layout
- `src/components/` - one file per section (Header, Player, FindMe, GithubCard, ...)
- `src/lib/` - music synth, icons, time/format helpers
- `src/styles.css` - all CSS
- `public/` - put `music.wav` here to play a real track (otherwise the built-in synth plays)

To add or change a link in "Find me", edit the `LINKS` list in `src/config.js`.
