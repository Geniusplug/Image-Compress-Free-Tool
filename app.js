
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

const infoModal = document.getElementById('infoModal');
const infoForm = document.getElementById('infoForm');
const skipInfo = document.getElementById('skipInfo');

const STRIPE_DONATE = 'https://buy.stripe.com/5kAg0J0co1MF7Ic8wy';
const CONTACT_EMAIL = 'info.geniusplugtechnology@gmail.com';

let items = []; // {id,file,url,compressedBlob,status,progress}

function uid(){ return Math.random().toString(36).slice(2,9) }

function updateQualityLabel(){ qualityVal.textContent = parseFloat(qualitySlider.value).toFixed(2) }
qualitySlider.addEventListener('input', updateQualityLabel);
updateQualityLabel();

yearSpan.textContent = new Date().getFullYear();

donateBtn.addEventListener('click', ()=> {
  // subtle button pulse and open donate
  donateBtn.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.06)' }, { transform: 'scale(1)' }], { duration: 420, easing: 'ease-out' });
  window.open(STRIPE_DONATE, '_blank');
});

contactBtn.addEventListener('click', ()=> {
  // open whatsapp as primary contact
  contactBtn.animate([{ transform: 'translateY(0)' }, { transform: 'translateY(-6px)' }, { transform: 'translateY(0)' }], { duration: 340 });
  window.open('https://wa.me/8801761487193', '_blank');
});

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

clearBtn.addEventListener('click', ()=>{ items.forEach(i=>{ try{ URL.revokeObjectURL(i.url)}catch{} }); items=[]; renderGallery(); });

const INFO_KEY = 'geniusplug_user_info_v1';
function hasSubmittedInfo(){ try{ return !!localStorage.getItem(INFO_KEY); }catch(e){ return false; } }

function showInfoModalIfNeeded(){ if(!hasSubmittedInfo()){ infoModal.hidden=false; } }

infoForm.addEventListener('submit',(e)=>{ e.preventDefault(); const fd=new FormData(infoForm); const data={ name: fd.get('name'), email: fd.get('email'), whatsapp: fd.get('whatsapp'), address: fd.get('address'), ts: new Date().toISOString() }; try{ localStorage.setItem(INFO_KEY, JSON.stringify(data)); }catch(e){ console.warn('localStorage failed',e); } const subject = encodeURIComponent('User Info Submission - Image Compress'); const body = encodeURIComponent(`Name: ${data.name}\nEmail: ${data.email}\nWhatsApp: ${data.whatsapp}\nAddress: ${data.address}\nTime: ${data.ts}`); const mailto = `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`; window.location.href = mailto; infoModal.hidden=true; alert('Thank you! A mail client has been opened to send your info.'); });

skipInfo.addEventListener('click', ()=>{ infoModal.hidden=true; try{ localStorage.setItem(INFO_KEY, 'skipped'); }catch{} });

setTimeout(showInfoModalIfNeeded, 1200);

renderGallery();
