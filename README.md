# Memory Garden
An interactive, personal storybook built with Next.js, React, TypeScript, Tailwind CSS, Framer Motion and Konva. The garden is an original ink-and-watercolor SVG illustration on aged paper, with bundled Caveat and Ma Shan Zheng handwriting fonts (SIL Open Font License files included).

## Develop and build
Node.js 22 or later:

```sh
npm ci
npm run dev
```

Validate with `npm run typecheck` and `npm run build`. Production Node hosting: `npm run build`, then `npm start`.

## Explore
- **Garden:** click year fruits to open a memory room, or planted flowers, trees and stars to reopen individual stories. The pocket watch changes the year and season. Seasons also have manual controls. Click the bird, rabbit, butterfly or dog to discover a short hidden story.
- **Timeline:** explore every year with stored memories, including years restored from the original scrapbook.
- **Plant a memory:** add a title, story and up to eight images, then choose a date, place, mood, plant and optional audio file. Joy and growth bring sunshine, nostalgia brings rain, and special memories bring stars. Saving plays a seed-growth animation.
- **Memory room:** read stories and photographs, listen to attached audio, or use the optional collage editor to arrange materials and export a 2000×1500 PNG. Existing scrapbook boards remain editable; saving preserves garden metadata and audio.
- **Collection:** save books, songs, movies, pictures and small keepsakes, with a note and optional image.

## Personal data
Memory and collection data are stored in browser IndexedDB, using the original `fragments-of-me` database so existing boards are retained. There is no account, server, cloud sync or external AI service. Memory images are resized to 1400px during planting. Audio files are stored locally and limited to 10 MB. Browser storage availability and quota still apply. Clearing browser data removes the garden; export precious memories as PNG backups. Data on different domains or browsers does not transfer automatically. The homepage shows up to nine plants for the selected year; all memories remain available in that year's room and the timeline. Empty historic years are blank chapters, not fabricated personal stories.

## GitHub Pages
`.github/workflows/pages.yml` deploys the static export from `main`. Select **GitHub Actions** in repository Settings → Pages. Locally, `BUILD_TARGET=pages npm run build` exports to `out/` with `/AAAA` as the base path. After deployment, the website is served at https://xuz8999-bit.github.io/AAAA/. Ordinary `npm run build` continues to support Node hosting.
