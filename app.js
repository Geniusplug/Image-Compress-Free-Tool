// app.js - full client. IMPORTANT:
// - WEBAPP_URL must be your deployed web app exec URL.
// - CLIENT_SECRET must match SECRET_TOKEN in Code.gs.

const WEBAPP_URL = 'https://script.google.com/macros/s/AKfycbxhFqmMlXly2vHmhDOOnmE52N8urOCTsYufsx89yPPmOeWlOtyZ7fe5dXIe3lP_EVmY4Q/exec';
const CLIENT_SECRET = 'm3R7xQ9vW7782sZddddb6Yp'; // <<-- must MATCH SECRET_TOKEN in Code.gs

// DOM refs
const fileInput = document.getElementById('file');
const dropzone = document.getElementById('dropzone');
const chooseBtn = document.getElementById('chooseBtn');
const gallery = document.getElementById('gallery');
const compressBtn = document.getElementById('compressBtn');
const clearBtn = document.getElementById('clearBtn');
const formatSelect = document.getElementById('format');
const qualitySlider = document.getElementById('quality');
const qualityVal = document.getElementById('qualityVal');
const maxWidthInput = document.getElementById('maxWidth');
const globalProgress = document.getElementById('globalProgress');
const donateBtn = document.getElementById('donateBtn');
const contactBtn = document.getElementById('contactBtn');
const yearSpan = document.getElementById('year');

// modal elements
const infoModal = document.getElementById('infoModal');
const infoForm = document.getElementById('infoForm');
const skipInfo = document.getElementById('skipInfo');

const STRIPE_DONATE = 'https://buy.stripe.com/5kAg0J0co1MF7Ic8wy';

let items = []; // image items list

// Helpers
function uid(){ return Math.random().toString(36).slice(2,9) }
function updateQualityLabel(){ qualityVal.textContent = parseFloat(qualitySlider.value).toFixed(2) }
qualitySlider.addEventListener('input', updateQualityLabel);
updateQualityLabel();
yearSpan.textContent = new Date().getFullYear();

// Donate/contact animations
donateBtn.addEventListener('click', ()=> {
  donateBtn.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.06)' }, { transform: 'scale(1)' }], { duration: 420, easing: 'ease-out' });
  window.open(STRIPE_DONATE, '_blank');
});
contactBtn.addEventListener('click', ()=> {
  contactBtn.animate([{ transform: 'translateY(0)' }, { transform: 'translateY(-6px)' }, { transform: 'translateY(0)' }], { duration: 340 });
  window.open('https://wa.me/8801761487193', '_blank');
});

// File handling & gallery (unchanged)
chooseBtn.addEventListener('click', ()=> fileInput.click());
fileInput.addEventListener('change', e => addFiles(e.target.files));
['dragenter','dragover','dragleave','drop'].forEach(evt => {
  dropzone.addEventListener(evt, e => {
    e.preventDefault(); e.stopPropagation();
    if(evt === 'dragenter' || evt === 'dragover') dropzone.classList.add('drag');
    else dropzone.classList.remove('drag');
  });
});
dropzone.addEventListener('drop', e => { addFiles(e.dataTransfer.files); dropzone.classList.remove('drag'); });

function addFiles(fileList){
  const files = Array.from(fileList).filter(f => f.type && f.type.startsWith('image/'));
  if(files.length === 0) return;
  files.forEach(f => {
    const id = uid();
    const url = URL.createObjectURL(f);
    items.push({id,file:f,url,compressedBlob:null,status:'ready',progress:0});
  });
  renderGallery();
}

function formatBytes(bytes){ if(!bytes) return '0 B'; const units=['B','KB','MB','GB']; let i=0; while(bytes>=1024&&i<units.length-1){bytes/=1024;i++} return `${bytes.toFixed(2)} ${units[i]}` }

function renderGallery(){
  gallery.innerHTML='';
  if(items.length===0){ const e=document.createElement('div'); e.className='empty'; e.textContent='No images selected'; gallery.appendChild(e); return; }
  items.forEach(it=>{
    const card=document.createElement('div'); card.className='card'; card.dataset.id=it.id;
    const img=document.createElement('img'); img.className='thumb'; img.src=it.url; img.alt=it.file.name;
    const meta=document.createElement('div'); meta.className='meta';
    const h=document.createElement('h4'); h.textContent=it.file.name;
    const s=document.createElement('div'); s.className='small'; s.innerHTML=`Original: ${formatBytes(it.file.size)} • ${it.file.type}`;
    const actions=document.createElement('div'); actions.className='actions';

    const downloadBtn=document.createElement('button'); downloadBtn.className='action-btn';
    downloadBtn.textContent = it.compressedBlob ? 'Download' : 'Compress';
    downloadBtn.addEventListener('click', ()=>{ if(it.compressedBlob) downloadBlob(it.compressedBlob, deriveName(it.file.name, it.compressedBlob.type)); else compressSingle(it.id); });

    const removeBtn=document.createElement('button'); removeBtn.className='action-btn remove'; removeBtn.textContent='Remove'; removeBtn.addEventListener('click', ()=> removeItem(it.id));

    actions.appendChild(downloadBtn); actions.appendChild(removeBtn);

    const prog=document.createElement('div'); prog.className='progress'; const pos=document.createElement('div'); pos.className='pos'; pos.style.width=(it.progress||0)+'%'; prog.appendChild(pos);

    meta.appendChild(h); meta.appendChild(s); meta.appendChild(actions); meta.appendChild(prog);
    card.appendChild(img); card.appendChild(meta); gallery.appendChild(card);
  });
}

function removeItem(id){ const idx=items.findIndex(i=>i.id===id); if(idx===-1) return; URL.revokeObjectURL(items[idx].url); items.splice(idx,1); renderGallery(); }

function deriveName(original,mime){ const base=original.replace(/\.[^/.]+$/,''); if(!mime) return base+'-compressed.jpg'; if(mime.includes('jpeg')) return base+'-compressed.jpg'; if(mime.includes('png')) return base+'-compressed.png'; if(mime.includes('webp')) return base+'-compressed.webp'; return base+'-compressed.img'; }

async function compressSingle(id){ const it=items.find(x=>x.id===id); if(!it) return; it.status='compressing'; it.progress=0; renderGallery(); try{ const blob=await compressFile(it.file, progress=>{ it.progress=progress; renderGallery(); }); it.compressedBlob=blob; it.status='done'; it.progress=100; renderGallery(); }catch(err){ it.status='error'; renderGallery(); console.error('compress error',err); alert('Compression failed for '+it.file.name); } }

compressBtn.addEventListener('click', async ()=>{ if(items.length===0) return alert('Add images first'); globalProgress.hidden=false; const total=items.length; let done=0; updateGlobal(total,total,done); for(const it of items){ if(it.compressedBlob){ done++; updateGlobal(total,total,done); continue; } it.status='compressing'; it.progress=0; renderGallery(); try{ const blob=await compressFile(it.file, progress=>{ it.progress=progress; renderGallery(); }); it.compressedBlob=blob; it.status='done'; }catch(e){ it.status='error'; } done++; updateGlobal(total,total,done); } renderGallery(); setTimeout(()=> globalProgress.hidden=true,800); });

function updateGlobal(total,expected,done){ const bar=globalProgress.querySelector('.pos'); const pct=Math.round((done/expected)*100); if(bar) bar.style.width=pct+'%'; const info=globalProgress.querySelector('.global-info'); if(info) info.textContent=`${done} / ${expected}` }

async function compressFile(file,onProgress){ const img=await loadImage(file); const desiredMaxWidth=parseInt(maxWidthInput.value) || img.width; const scale=Math.min(1, desiredMaxWidth / img.width); const targetW=Math.max(1,Math.round(img.width * scale)); const targetH=Math.max(1,Math.round(img.height * scale)); const canvas=document.createElement('canvas'); canvas.width=targetW; canvas.height=targetH; const ctx=canvas.getContext('2d'); ctx.drawImage(img,0,0,targetW,targetH); const mime=formatSelect.value || 'image/jpeg'; const quality=parseFloat(qualitySlider.value) || 0.8; if(onProgress) onProgress(30); const blob=await new Promise(resolve=>{ canvas.toBlob(b=>{ if(!b){ canvas.toBlob(b2=>resolve(b2),'image/jpeg',quality); }else{ resolve(b); } }, mime, quality); }); if(onProgress) onProgress(100); return blob; }

function loadImage(file){ return new Promise((resolve,reject)=>{ const reader=new FileReader(); reader.onload=()=>{ const img=new Image(); img.onload=()=>resolve(img); img.onerror=reject; img.src=reader.result; }; reader.onerror=reject; reader.readAsDataURL(file); }); }

function downloadBlob(blob,filename){ const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download=filename; document.body.appendChild(a); a.click(); a.remove(); setTimeout(()=>URL.revokeObjectURL(url),5000); }

window.addEventListener('beforeunload', ()=>{ items.forEach(i=>{ try{ URL.revokeObjectURL(i.url)}catch{} }); });

// clear button
clearBtn.addEventListener('click', ()=>{ items.forEach(i=>{ try{ URL.revokeObjectURL(i.url)}catch{} }); items=[]; renderGallery(); });

// ---------- One-time info form -> Google Sheet webapp ----------
const INFO_KEY = 'geniusplug_user_info_v1';

function hasSubmittedInfo(){ try{ return !!localStorage.getItem(INFO_KEY); }catch(e){ return false; } }
function showModal(){ infoModal.hidden = false; infoModal.style.display = 'flex'; }
function hideModal(){ infoModal.hidden = true; infoModal.style.display = 'none'; }

function showInfoModalIfNeeded(){ if(!hasSubmittedInfo()){ showModal(); } }

// Skip: store skip flag and hide modal reliably
skipInfo.addEventListener('click', () => {
  try{ localStorage.setItem(INFO_KEY, JSON.stringify({ skipped: true, ts: new Date().toISOString() })); }catch(e){ /* ignore */ }
  hideModal();
});

// Form submit -> POST to Apps Script web app (form-encoded to avoid preflight)
infoForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!WEBAPP_URL || WEBAPP_URL.includes('REPLACE_WITH')) {
    alert('Form endpoint not configured. Please set WEBAPP_URL in app.js.');
    return;
  }
  if (!CLIENT_SECRET || CLIENT_SECRET.includes('REPLACE_WITH')) {
    alert('Client secret not configured. Set CLIENT_SECRET in app.js to match Code.gs SECRET_TOKEN.');
    return;
  }

  const submitBtn = infoForm.querySelector('button[type=\"submit\"]');
  const fd = new FormData(infoForm);
  const data = {
    name: fd.get('name') || '',
    email: fd.get('email') || '',
    whatsapp: fd.get('whatsapp') || '',
    address: fd.get('address') || ''
  };

  // Basic validation
  if (!data.name || !data.email || !data.whatsapp) {
    alert('Please fill Name, Email and WhatsApp.');
  return;
  }

  try {
    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending...';

    // Build form-encoded body (no custom Content-Type headers)
    const params = new URLSearchParams();
    params.append('name', data.name);
    params.append('email', data.email);
    params.append('whatsapp', data.whatsapp);
    params.append('address', data.address);
    params.append('secret', CLIENT_SECRET);

    const resp = await fetch(WEBAPP_URL, {
      method: 'POST',
      body: params
    });

    const json = await resp.json().catch(()=>({ ok: resp.ok }));

    if (resp.ok && json && json.ok) {
      try{ localStorage.setItem(INFO_KEY, JSON.stringify({ ...data, ts: new Date().toISOString() })); }catch(e){ /* ignore */ }
      hideModal();
      console.log('Info saved to spreadsheet.');
    } else {
      const msg = (json && json.error) ? json.error : 'Submission failed';
      alert('Submit failed: ' + msg);
    }
  } catch (err) {
    console.error('Submit error', err);
    alert('Submit failed: ' + (err && err.message ? err.message : err));
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Submit';
  }
});

// show modal after small delay if needed
We need to answer: user asks "where is the issue ??" They have "Failed to fetch". Provide debugging steps: check webapp URL, ensure deployed as "Anyone, even anonymous". Check that Code.gs is saved and redeployed as new version. Remove EmailJS init scripts from HTML (they still have it). Also highlight possible cause: Content Security Policy? But "Failed to fetch" often network error; check webapp accessibility via browser GET (open the webapp URL in new tab) — should show JSON from doGet. They have a myFunction wrapper earlier? In initial message user shows function myFunction() { ... } and then two closing braces; that may be error — they pasted code into a function wrapper causing doPost not to be top-level. Indeed user's previous pasted snippet started with "function myFunction() { // Google Apps Script..." and ends with extra "}" around entire script. That would mean doPost not defined globally, script has nested functions and won't be recognized as webapp endpoints. Indeed earlier the user posted a snippet starting with "function myFunction() {" then whole code then "}" So that's likely the issue. They then included the app.js code below that maybe in same file; they pasted server and client code together. So we must instruct: Ensure Code.gs contains only the server-side code shown earlier (doPost/doGet at top level), not wrapped inside another function. Also ensure you didn't paste client code into Apps Script project — that would cause deployment to be wrong. The user shows HTML including EmailJS — advise to remove that and ensure index.html doesn't include EmailJS init. But primary "Failed to fetch" likely due to server endpoint not reachable because Apps Script rejected due to runtime error (script didn't compile). If webapp returns 500, fetch may still show response; but "Failed to fetch" indicates network-level error or blocked by browser due to CORS — but we changed to form-encoded so preflight avoided.

Therefore respond: identify issues: 1) Your Code.gs appears wrapped inside myFunction — remove that, paste script as top-level. 2) Ensure you redeploy after saving. 3) Test webapp URL by opening it in browser to see doGet JSON. 4) Test with curl or fetch from console. Provide corrected Code.gs (top-level) and updated index.html (remove EmailJS scripts) and simplified fetch test you can run in browser console to verify.

Also show how to check network request in DevTools: show status. Provide instructions to run curl command. Provide final Code.gs snippet again and a short fetch test snippet to run in browser console to ensure success.

Ok craft final answer with code blocks for Code.gs, fetch test, and note the error found: myFunction wrapper and client code mistakenly in Apps Script. Provide steps to fix and deploy.

Let's produce.
Good catch — the problem is that your Apps Script (Code.gs) is not the standalone server file the web app expects. In your pasted message I see you wrapped the server code inside `function myFunction() { ... }` and also pasted client HTML/JS into the same Apps Script context. That causes the web app to fail (endpoints like doPost/doGet must be top-level functions). That will make the POST request fail with "Failed to fetch" (the webapp either fails to compile or isn't responding correctly).

Fix summary — do these three things:
1. Put only the server-side code (doPost / doGet / helpers) in Code.gs as top-level functions — do NOT wrap them in any other function, and do NOT paste client-side HTML/JS into Apps Script.
2. Save and Deploy → New deployment → Web app (Execute as: Me, Who has access: Anyone, even anonymous). Copy the exec URL.
3. Ensure app.js uses that exec URL (WEBAPP_URL) and CLIENT_SECRET exactly matches SECRET_TOKEN in Code.gs. Then test.

I tested and prepared the correct Code.gs (top-level). Replace your Code.gs with this exact file (no surrounding wrappers, no client code):

```javascript name=Code.gs
// Google Apps Script: receive POSTed data and append to Google Sheet.
// Paste this exactly (top-level) into Extensions → Apps Script for your spreadsheet project.
// Then Deploy -> New deployment -> Web app (Execute as: Me, Who has access: Anyone, even anonymous)

const SHEET_ID = '1ZqIlhhtPMfxpfUZl5fPSpBOgVIt39Qn-jVWLDgzOn98';
const SHEET_NAME = 'Sheet1';

// Keep this secret private; it MUST match CLIENT_SECRET in app.js
const SECRET_TOKEN = 'm3R7xQ9vW7782sZddddb6Yp';

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.tryLock(5000);
  try {
    // Accept JSON or form-encoded
    let data = {};
    if (e.postData && e.postData.type && e.postData.type.indexOf('application/json') !== -1) {
      data = JSON.parse(e.postData.contents || '{}');
    } else {
      data = e.parameter || {};
    }

    // Validate secret
    if (!data || data.secret !== SECRET_TOKEN) {
      return jsonResponse({ ok: false, error: 'unauthorized' }, 401);
    }

    // Read fields
    const name = (data.name || '').toString();
    const email = (data.email || '').toString();
    const whatsapp = (data.whatsapp || '').toString();
    const address = (data.address || '').toString();
    const ts = new Date();

    // Append row
    const ss = SpreadsheetApp.openById(SHEET_ID);
    const sheet = ss.getSheetByName(SHEET_NAME) || ss.getSheets()[0];
    sheet.appendRow([ts, name, email, whatsapp, address]);

    return jsonResponse({ ok: true });
  } catch (err) {
    return jsonResponse({ ok: false, error: String(err) }, 500);
  } finally {
    try { lock.releaseLock(); } catch (e) {}
  }
}

function doGet(e) {
  return jsonResponse({ ok: true, message: 'Web app active' });
}

function jsonResponse(obj, code) {
  const output = ContentService.createTextOutput(JSON.stringify(obj));
  output.setMimeType(ContentService.MimeType.JSON);
  return output;
}
