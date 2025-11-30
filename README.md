# Image Compress (Client-side)

A minimal, client-side image compression web app you can host for free. Everything runs in the browser — no server, no upload, no hosting cost beyond static hosting.

Features
- Drag & drop or file picker
- Choose output format (JPEG, WebP, PNG)
- Adjust quality and max width
- Preview and download compressed images
- All processing is done client-side

How to use
1. Clone or create a new repo (e.g., github.com/<your-username>/image-compress).
2. Add these files (index.html, app.js, style.css, README.md, LICENSE).
3. Push to GitHub.

Free hosting options
- GitHub Pages: Serve the repository's root or /docs folder. (Settings -> Pages -> Select branch)
- Cloudflare Pages: Connect the repo, it builds static site instantly.
- Netlify / Vercel: Also support static site deploys with free tiers.

Notes and limitations
- EXIF orientation / full metadata preservation is not handled. If you need EXIF preserved, you must use a client-side library that reads/writes EXIF (adds complexity).
- Advanced codecs (AVIF with WASM, or Squoosh codecs) can yield better compression but increase bundle size. This starter uses browser canvas + toBlob for broad compatibility.

License
MIT — see LICENSE file.