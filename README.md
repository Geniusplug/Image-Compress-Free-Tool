# Image Compress (Client-side)
https://geniusplug.github.io/Image-Compress-Free-Tool/
Improved client-side image compression web app with:
- Multi-image upload and previews
- Per-image remove and per-image compress/download button
- Global "Compress Selected" with progress
- Format, quality and max-width controls
- Fully client-side (nothing is uploaded)

How to deploy (quick)
1. Add these files to the root of your repository (index.html, style.css, app.js, README.md).
2. Enable GitHub Pages in your repository settings:
   - Settings → Pages → Source: Branch = main, Folder = / (root) → Save
3. Wait a few minutes and open:
   https://<your-username>.github.io/<your-repo-name>

If you'd rather use Actions to auto-deploy, add a Pages workflow file at:
.github/workflows/pages.yml (example in repo).

Notes
- Browser support: modern browsers support canvas.toBlob; WebP support varies by browser. The app falls back to JPEG if the requested output type is not supported by the browser.
- If you want server-side heavy codecs (AVIF/WASM), that is possible but increases complexity and hosting requirements.
