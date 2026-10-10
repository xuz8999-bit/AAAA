# Fragments of Me
A personal memory desktop built with Next.js, React, TypeScript, Tailwind, Framer Motion and Konva.

## Development
Node.js 22 or later. Run `npm ci`, then `npm run dev`. Run `npm run build` and `npm run typecheck` to validate. Production: `npm run build && npm start`.

## Features
Retro desktop, memory archive and search, editable diary, local audio playback, photo upload, canvas drag/resize/rotate and layering, text and decorative elements, four board backgrounds, automatic arrangement, local memory persistence and high-resolution PNG export.

Memory data is saved in browser IndexedDB; diary text uses localStorage. No account, backend or cross-device sync is included. Export PNG backups before clearing browser data. Uploaded images are resized to 1600px to reduce storage usage. Music is session-local. Sample photographs are bundled locally from the Tailwind Next.js Starter Blog sample collection (Unsplash imagery). Uploaded photos also work offline. Templates use deterministic arrangement rather than an AI service. Canvas is a finite 1000×750 board with zoom and scrolling.

## Art direction
Original local SVG materials combine botanical line work, antique paper, pixel butterflies, silver-blue lilies and archive stamps. Choose Simple, Mixed or Layered composition density. Auto arrangement preserves photo proportions, keeps manually added decorative materials and fits photo grids within the board. Art materials and composition density persist with saved memories and are included in PNG exports.
