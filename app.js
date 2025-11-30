// Simple client-side image compressor using canvas.
// This aims for broad browser compatibility and zero server cost.

const fileInput = document.getElementById('file');
const dropzone = document.getElementById('dropzone');
const compressBtn = document.getElementById('compressBtn');
const list = document.getElementById('list');
const formatSelect = document.getElementById('format');
const qualitySlider = document.getElementById('quality');
const qualityVal = document.getElementById('qualityVal');
const maxWidthInput = document.getElementById('maxWidth');

let files = [];

qualitySlider.addEventListener('input', () => qualityVal.textContent = qualitySlider.value);

dropzone.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', e => addFiles(e.target.files));

['dragenter','dragover','dragleave','drop'].forEach(evt => {
  dropzone.addEventListener(evt, e => {
    e.preventDefault();
    e.stopPropagation();
  });
});
dropzone.addEventListener('drop', e => addFiles(e.dataTransfer.files));

function addFiles(fileList){
  files = Array.from(fileList).filter(f => f.type.startsWith('image/'));
  renderList();
}

function formatBytes(bytes){
  if (bytes === 0) return '0 B';
  const k = 1024, dm = 2, sizes = ['B','KB','MB','GB'];
  const i = Math.floor(Math.log(bytes)/Math.log(k));
  return parseFloat((bytes/Math.pow(k,i)).toFixed(dm)) + ' ' + sizes[i];
}

function renderList(){
  list.innerHTML = '';
  files.forEach((f, idx) => {
    const el = document.createElement('div');
    el.className = 'item';
    const img = document.createElement('img');
    img.src = URL.createObjectURL(f);
    const info = document.createElement('div');
    info.innerHTML = `<div><strong>${f.name}</strong></div><div class="small">Original: ${formatBytes(f.size)} • ${f.type}</div>`;
    el.appendChild(img);
    el.appendChild(info);
    list.appendChild(el);
  });
  if(files.length===0) list.innerHTML = '<div class="small">No images selected</div>';
}

async function compressAll(){
  if(files.length===0) return alert('Choose some images first');
  compressBtn.disabled = true;
  list.innerHTML = '<div class="small">Compressing…</div>';
  const results = [];
  for(const f of files){
    try{
      const compressed = await compressFile(f);
      results.push({orig: f, out: compressed});
    }catch(err){
      console.error('Compress error', err);
    }
  }
  showResults(results);
  compressBtn.disabled = false;
}

function showResults(results){
  list.innerHTML = '';
  results.forEach(r => {
    const el = document.createElement('div');
    el.className = 'item';
    const img = document.createElement('img');
    img.src = URL.createObjectURL(r.out);
    const info = document.createElement('div');
    info.innerHTML = `<div><strong>${r.orig.name}</strong></div>
      <div class="small">Before: ${formatBytes(r.orig.size)} • After: ${formatBytes(r.out.size)} • Saved: ${Math.round((1 - r.out.size/r.orig.size)*100)}%</div>`;
    const dl = document.createElement('a');
    dl.href = URL.createObjectURL(r.out);
    dl.download = r.orig.name.replace(/\.[^/.]+$/, "") + "-compressed" + getExtFromType(r.out.type);
    dl.textContent = 'Download';
    dl.style.marginLeft = '12px';
    el.appendChild(img);
    el.appendChild(info);
    el.appendChild(dl);
    list.appendChild(el);
  });
}

function getExtFromType(mime){
  if(!mime) return '.jpg';
  if(mime.includes('jpeg')) return '.jpg';
  if(mime.includes('png')) return '.png';
  if(mime.includes('webp')) return '.webp';
  return '.img';
}

function loadImage(file){
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = reader.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function compressFile(file){
  const img = await loadImage(file);
  const maxWidth = parseInt(maxWidthInput.value) || img.width;
  const scale = Math.min(1, maxWidth / img.width);
  const targetWidth = Math.round(img.width * scale);
  const targetHeight = Math.round(img.height * scale);

  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

  const mime = formatSelect.value;
  const quality = parseFloat(qualitySlider.value);

  // Note: PNG's quality is ignored by toBlob in many browsers; convert PNG -> WEBP/JPEG for smaller sizes if desired.
  return await new Promise((resolve) => {
    canvas.toBlob(blob => {
      // If browser doesn't support desired mime type fallback to jpeg
      if (!blob) {
        canvas.toBlob(b => resolve(b), 'image/jpeg', quality);
      } else {
        resolve(blob);
      }
    }, mime, quality);
  });
}

compressBtn.addEventListener('click', compressAll);

// initial state
renderList();
````markdown name=README.md
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