/* ============================================================
   Fiches d'intervention — Regards d'eau
   Logique de l'application (état, formulaire, PDF, stockage).

   Sommaire :
     1.  Config & data           — types de fiches, tâches, produits
     2.  Settings                — réglages société (localStorage)
     3.  Navigation home / fiche — écrans, affichage par type
     4.  Techs                   — sélection des techniciens
     5.  Tasks                   — checklist (hivernage / mise en service)
     6.  Matériel                — lignes libres (SAV / intervention)
     7.  Livraison produits      — produits livrés + cautions
     8.  Photos                  — capture et compression
     9.  Brouillons              — sauvegarde automatique multi-fiches
     10. Mémoire clients         — autocomplétion nom/adresse
     11. History                 — fiches enregistrées, statut, filtres
     12. Indicateur de stockage
     13. Durée (temps passé)
     14. Gather form data        — construit l'objet fiche complet
     15. PDF generation
     16. Send by email           — partage iOS / mailto
     17. Toast
     18. Init                    — DOMContentLoaded
   ============================================================ */

/* ---------- Config & data ---------- */

function escapeHtml(str){
  return String(str ?? '').replace(/[&<>"']/g, c => ({
    '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'
  }[c]));
}

const DELIVERY_GROUPS = [
  { label: "Chlore", items: ["Chlore PPG 20L", "Chlore RDO 20L", "Chlore Brentag 30L"] },
  { label: "pH Minus", items: ["pH Minus PPG 20L", "pH Minus RDO 20L", "pH Minus Brentag 30L"] },
  { label: "Chlorifix / Chlorilong", items: ["Chlorifix 1kg", "Chlorifix 5kg", "Chlorifix 60 1kg", "Chlorifix 60 5kg", "Chlorilong 5kg"] },
  { label: "Désalgin", items: ["Desalgin 1L", "Desalgin 3L"] },
  { label: "Tests & sel", items: ["Aquachek jaune", "Aquachek Salt", "Sac de sel 25kg"] },
];
const DELIVERY_PRODUCTS = DELIVERY_GROUPS.flatMap(g => g.items);

// Seuls les bidons chlore / pH sont consignés
const CAUTION_PRODUCTS = [...DELIVERY_GROUPS[0].items, ...DELIVERY_GROUPS[1].items];

const TASKS = {
  mise_en_service: [
    "Contrôle visuel du bassin et des équipements",
    "Démarrage pompe de filtration",
    "Réglage horloge / temps de filtration",
    "Analyse et équilibrage eau (TAC, pH, chlore)",
    "Vérification skimmers et bonde de fond",
    "Test / réglage électrolyseur ou traitement auto",
    "Nettoyage du bassin (fond, ligne d'eau)",
    "Mise en route robot / balai automatique",
    "Vérification étanchéité canalisations",
    "Explication du fonctionnement au client"
  ],
  hivernage: [
    "Pose coffret hors-gel (matériel électrique inclus)",
    "Réglage coffret hors-gel (2°C)",
    "Réglage horloge de filtration",
    "Fourniture et pose produit d'hivernage 5L",
    "Hivernage pompe à chaleur",
    "Hivernage filtre à sable/pompe",
    "Hivernage automate // électrolyseur de sel",
    "Hivernage sonde chlore/pH // électrode",
    "Hivernage NACC",
    "Pose bâche // filet d'hivernage",
    "Pose Gyzmo",
    "Pose Flotteur",
    "Caution chlore/pH"
  ],
  sav: [],
  intervention: [],
  livraison_spa: [],
  livraison_produits: []
};

// Décrit la structure réelle de chaque fiche papier :
// - checklist : liste de tâches à cocher (mise en service / hivernage)
// - description : zone "Descriptif de l'intervention" libre (SAV / intervention)
// - materiel : zone "Matériel / produits utilisés" (SAV / intervention)
const TYPE_CONFIG = {
  mise_en_service: { checklist: true,  description: true,  materiel: true,  delivery: false },
  hivernage:        { checklist: true,  description: false, materiel: false, delivery: false },
  sav:               { checklist: false, description: true,  materiel: true,  delivery: false },
  intervention:       { checklist: false, description: true,  materiel: true,  delivery: false },
  livraison_spa:       { checklist: false, description: true,  materiel: true,  delivery: false },
  livraison_produits:   { checklist: false, description: false, materiel: false, delivery: true  },
};

const TYPE_LABELS = {
  mise_en_service: "Mise en service",
  hivernage: "Hivernage",
  sav: "SAV",
  intervention: "Intervention",
  livraison_spa: "Livraison spa",
  livraison_produits: "Livraison produits"
};

const TYPE_ICONS = {
  mise_en_service: "🔧",
  hivernage: "❄️",
  sav: "🚨",
  intervention: "🧹",
  livraison_spa: "🛁",
  livraison_produits: "📦"
};

let state = {
  type: "intervention",
  screen: "home",
  draftId: null,
  historyId: null,
  checkedTasks: {},
  selectedTechs: [],
  photos: [],
  hivernageType: "",
  devisNeeded: false,
  delivery: {},      // { "Chlore PPG 20L": { checked:true, qty:"2" }, ... }
  caution: {},        // même structure que delivery, limité aux bidons chlore/pH
};

/* ---------- Settings (localStorage) ---------- */

function loadSettings(){
  const defaults = {
    companyName: "Regards d'eau",
    companyEmail: "info@regards-deau.be",
    companyAddress: "Rue de Bardanes 4, 7522 Marquain",
    companyPhone: "069/77.66.79 – 0478/24.86.33",
    companyTVA: "BE0835.637.578",
    techs: ["Noël", "Olivier", "Aymeric"]
  };
  try{
    return JSON.parse(localStorage.getItem('fiche_settings') || 'null') || defaults;
  }catch(e){
    return defaults;
  }
}
let settings = loadSettings();

function refreshHeader(){
  document.getElementById('companyNameHead').textContent = settings.companyName || "Fiches d'intervention";
  document.getElementById('companySubHead').textContent = "piscines & wellness";
}

function closeSettings(){
  document.getElementById('settingsModal').classList.remove('show');
}
function openSettings(){
  document.getElementById('setCompanyName').value = settings.companyName || "";
  document.getElementById('setCompanyEmail').value = settings.companyEmail || "";
  document.getElementById('setCompanyAddress').value = settings.companyAddress || "";
  document.getElementById('setCompanyPhone').value = settings.companyPhone || "";
  document.getElementById('setCompanyTVA').value = settings.companyTVA || "";
  document.getElementById('setTechs').value = (settings.techs || []).join("\n");
  document.getElementById('settingsModal').classList.add('show');
}
function saveSettings(){
  settings.companyName = document.getElementById('setCompanyName').value.trim() || "Regards d'eau";
  settings.companyEmail = document.getElementById('setCompanyEmail').value.trim();
  settings.companyAddress = document.getElementById('setCompanyAddress').value.trim();
  settings.companyPhone = document.getElementById('setCompanyPhone').value.trim();
  settings.companyTVA = document.getElementById('setCompanyTVA').value.trim();
  settings.techs = document.getElementById('setTechs').value.split("\n").map(s=>s.trim()).filter(Boolean);
  try{
    localStorage.setItem('fiche_settings', JSON.stringify(settings));
  }catch(e){
    showToast("Erreur : stockage plein, réglages non sauvegardés");
    return;
  }
  document.getElementById('settingsModal').classList.remove('show');
  refreshHeader();
  renderTechChips();
  showToast("Réglages enregistrés");
}

/* ---------- Navigation home / fiche ---------- */

const DISABLED_TYPES = ['mise_en_service', 'livraison_spa'];

function renderTiles(){
  const wrap = document.getElementById('tileGrid');
  wrap.innerHTML = '';
  Object.keys(TYPE_LABELS).forEach(key=>{
    const el = document.createElement('div');
    const isDisabled = DISABLED_TYPES.includes(key);
    el.className = 'tile' + (isDisabled ? ' tile-disabled' : '');
    el.innerHTML = `<div class="tile-icon">${TYPE_ICONS[key]}</div><div class="tile-label">${TYPE_LABELS[key]}</div>${isDisabled ? '<div class="tile-badge">Bientôt</div>' : ''}`;
    if(!isDisabled) el.onclick = ()=> selectType(key);
    wrap.appendChild(el);
  });
}

function selectType(key){
  state.type = key;
  state.draftId = null;
  state.historyId = null;
  resetForm();
  state.screen = 'form';
  showScreen();
}

function hasUnsavedData(){
  const client = document.getElementById('clientName').value.trim();
  const street = document.getElementById('clientStreet').value.trim();
  const city = document.getElementById('clientCity').value.trim();
  const desc = document.getElementById('description').value.trim();
  const remarks = document.getElementById('remarks').value.trim();
  const anyTask = Object.values(state.checkedTasks).some(Boolean);
  const anyMat = Array.from(document.querySelectorAll('#matList .mat-row input')).some(i=>i.value.trim());
  const anyDeliveryOther = Array.from(document.querySelectorAll('#deliveryOtherList .mat-row input')).some(i=>i.value.trim());
  const anyDelivery = Object.values(state.delivery).some(p=>p.checked) || anyDeliveryOther;
  const anyCaution = Object.values(state.caution).some(p=>p.checked);
  return !!(client || street || city || desc || remarks || anyTask || anyMat || anyDelivery || anyCaution || state.selectedTechs.length || state.photos.length);
}

function goHome(){
  saveDraftNow();
  if(hasUnsavedData()){
    showToast('Fiche mise de côté comme brouillon');
  }
  resetForm();
  state.screen = 'home';
  showScreen();
}

function showScreen(){
  const isForm = state.screen === 'form';
  document.getElementById('homeScreen').style.display = isForm ? 'none' : 'block';
  document.getElementById('formScreen').style.display = isForm ? 'block' : 'none';
  document.getElementById('formTopbar').style.display = isForm ? 'flex' : 'none';
  document.getElementById('bottomBar').style.display = isForm ? 'flex' : 'none';
  document.getElementById('formTypeLabel').textContent = isForm ? TYPE_LABELS[state.type] : '';
  window.scrollTo(0,0);
  if(isForm){
    renderTasks();
    renderHivernageType();
    renderTechChips();
    applyTypeVisibility();
  } else {
    renderHistory();
    renderDraftBanner();
  }
}

function applyTypeVisibility(){
  const cfg = TYPE_CONFIG[state.type] || {};
  document.getElementById('tasksCard').style.display = cfg.checklist ? 'block' : 'none';
  document.getElementById('descriptionCard').style.display = cfg.description ? 'block' : 'none';
  document.getElementById('materielCard').style.display = cfg.materiel ? 'block' : 'none';
  document.getElementById('deliveryCard').style.display = cfg.delivery ? 'block' : 'none';
  document.getElementById('cautionCard').style.display = cfg.delivery ? 'block' : 'none';
  if(cfg.delivery){
    renderDeliveryProducts();
    renderCautionProducts();
  }
}

function resetForm(){
  state.draftId = null;
  state.historyId = null;
  document.getElementById('clientName').value = '';
  document.getElementById('clientStreet').value = '';
  document.getElementById('clientPostal').value = '';
  document.getElementById('clientCity').value = '';
  document.getElementById('description').value = '';
  document.getElementById('remarks').value = '';
  document.getElementById('devisDetail').value = '';
  document.getElementById('fDate').value = new Date().toISOString().slice(0,10);
  document.getElementById('fDurationInput').value = '00:00';
  document.getElementById('matList').innerHTML = '';
  addMatRow();
  state.checkedTasks = {};
  state.selectedTechs = [];
  state.photos = [];
  state.hivernageType = '';
  state.devisNeeded = false;
  state.delivery = {};
  document.getElementById('deliveryOtherList').innerHTML = '';
  state.caution = {};
  renderPhotos();
  const box = document.getElementById('devisBox');
  box.style.background = ''; box.style.borderColor = 'var(--aqua)'; box.textContent = '';
  document.getElementById('devisDetailField').style.display = 'none';
}

function renderHivernageType(){
  const field = document.getElementById('hivernageTypeField');
  if(state.type !== 'hivernage'){ field.style.display = 'none'; return; }
  field.style.display = 'block';
  const wrap = document.getElementById('hivernageTypeChips');
  wrap.innerHTML = '';
  ['ACTIF','PASSIF'].forEach(opt=>{
    const el = document.createElement('div');
    el.className = 'chip' + (state.hivernageType===opt ? ' on':'');
    el.textContent = opt;
    el.onclick = ()=>{ state.hivernageType = (state.hivernageType===opt ? '' : opt); renderHivernageType(); saveDraft(); };
    wrap.appendChild(el);
  });
}

function applyDevisUI(){
  const box = document.getElementById('devisBox');
  const span = document.getElementById('devisSpan');
  const detail = document.getElementById('devisDetailField');
  box.style.background = state.devisNeeded ? 'var(--teal)' : '';
  box.style.borderColor = state.devisNeeded ? 'var(--teal)' : 'var(--aqua)';
  box.textContent = state.devisNeeded ? '✓' : '';
  box.style.color = '#fff';
  span.style.color = state.devisNeeded ? 'var(--ink-soft)' : '';
  detail.style.display = state.devisNeeded ? 'block' : 'none';
}

function toggleDevis(){
  state.devisNeeded = !state.devisNeeded;
  applyDevisUI();
  saveDraft();
}

/* ---------- Techs ---------- */

function renderTechChips(){
  const wrap = document.getElementById('techChips');
  wrap.innerHTML = '';
  (settings.techs || []).forEach(name=>{
    const el = document.createElement('div');
    el.className = 'chip' + (state.selectedTechs.includes(name) ? ' on':'');
    el.textContent = name;
    el.onclick = ()=>{
      if(state.selectedTechs.includes(name)){
        state.selectedTechs = state.selectedTechs.filter(t=>t!==name);
      } else {
        state.selectedTechs.push(name);
      }
      renderTechChips();
      saveDraft();
    };
    wrap.appendChild(el);
  });
}

/* ---------- Tasks ---------- */

function renderTasks(){
  document.getElementById('tasksTitle').textContent = "Tâches effectuées — " + TYPE_LABELS[state.type];
  const wrap = document.getElementById('taskList');
  wrap.innerHTML = '';
  TASKS[state.type].forEach((task, i)=>{
    const done = !!state.checkedTasks[i];
    const el = document.createElement('div');
    el.className = 'task' + (done ? ' done':'');
    el.innerHTML = `<div class="box">${done ? '✓':''}</div><span>${task}</span>`;
    el.onclick = ()=>{
      state.checkedTasks[i] = !state.checkedTasks[i];
      renderTasks();
      saveDraft();
    };
    wrap.appendChild(el);
  });
}

/* ---------- Matériel ---------- */

function addMatRow(name='', qty=''){
  const wrap = document.getElementById('matList');
  const row = document.createElement('div');
  row.className = 'mat-row';
  row.innerHTML = `
    <input type="text" placeholder="Désignation (ex: pastilles chlore)" value="${escapeHtml(name)}">
    <input type="text" placeholder="Qté" class="mono" value="${escapeHtml(qty)}">
    <div class="rm-btn" onclick="this.parentElement.remove(); saveDraft();">✕</div>`;
  wrap.appendChild(row);
}

/* ---------- Livraison produits ---------- */

function buildDelivRow(name, entry, onToggle, onQtyChange){
  const row = document.createElement('div');
  row.className = 'deliv-row' + (entry.checked ? ' checked' : '');
  row.innerHTML = `
    <div class="box"></div>
    <span class="deliv-label"></span>
    <div class="qty-stepper${entry.checked ? '' : ' disabled'}">
      <button type="button" class="qty-btn" data-dir="-1">−</button>
      <input type="text" class="qty-val-input mono" inputmode="numeric" value="${escapeHtml(entry.qty || '1')}">
      <button type="button" class="qty-btn" data-dir="1">+</button>
    </div>
  `;
  row.querySelector('.box').textContent = entry.checked ? '✓' : '';
  if(entry.checked){ row.querySelector('.box').style.background = 'var(--teal)'; row.querySelector('.box').style.borderColor = 'var(--teal)'; }
  row.querySelector('.deliv-label').textContent = name;

  const check = ()=> onToggle();
  row.querySelector('.box').onclick = check;
  row.querySelector('.deliv-label').onclick = check;

  const qtyInput = row.querySelector('.qty-val-input');
  qtyInput.oninput = ()=> onQtyChange(qtyInput.value);
  row.querySelectorAll('.qty-btn').forEach(btn=>{
    btn.onclick = ()=>{
      const dir = parseInt(btn.dataset.dir, 10);
      const cur = parseInt(qtyInput.value, 10) || 0;
      const next = Math.max(1, cur + dir);
      qtyInput.value = next;
      onQtyChange(String(next));
    };
  });
  return row;
}

function toggleDeliveryProduct(name){
  const cur = state.delivery[name] || { checked:false, qty:'' };
  cur.checked = !cur.checked;
  if(cur.checked && !cur.qty) cur.qty = '1';
  state.delivery[name] = cur;
  renderDeliveryProducts();
  saveDraft();
}

function renderDeliveryProducts(){
  const wrap = document.getElementById('deliveryList');
  if(!wrap) return;
  wrap.innerHTML = '';

  DELIVERY_GROUPS.forEach(group=>{
    const groupLabel = document.createElement('div');
    groupLabel.className = 'deliv-group-label';
    groupLabel.textContent = group.label;
    wrap.appendChild(groupLabel);

    group.items.forEach(name=>{
      const entry = state.delivery[name] || { checked:false, qty:'' };
      const row = buildDelivRow(name, entry,
        ()=> toggleDeliveryProduct(name),
        (val)=>{
          const cur = state.delivery[name] || { checked:false, qty:'' };
          cur.qty = val;
          state.delivery[name] = cur;
          saveDraft();
        }
      );
      wrap.appendChild(row);
    });
  });

  updateDeliveryCounter();
}

function addDeliveryOtherRow(text='', qty=''){
  const wrap = document.getElementById('deliveryOtherList');
  const row = document.createElement('div');
  row.className = 'mat-row';
  row.innerHTML = `
    <input type="text" placeholder="Nom du produit...">
    <input type="text" placeholder="Qté" class="mono">
    <div class="rm-btn">✕</div>`;
  const inputs = row.querySelectorAll('input');
  inputs[0].value = text;
  inputs[1].value = qty;
  inputs.forEach(inp => inp.oninput = ()=>{ saveDraft(); updateDeliveryCounter(); });
  row.querySelector('.rm-btn').onclick = ()=>{ row.remove(); saveDraft(); updateDeliveryCounter(); };
  wrap.appendChild(row);
}

function updateDeliveryCounter(){
  const productCount = Object.values(state.delivery).filter(p=>p.checked).length;
  const otherCount = Array.from(document.querySelectorAll('#deliveryOtherList .mat-row input:first-child'))
    .filter(i=>i.value.trim()).length;
  const count = productCount + otherCount;
  const counterEl = document.getElementById('deliveryCounter');
  counterEl.textContent = count;
  counterEl.style.display = count > 0 ? 'inline-block' : 'none';
}

function toggleCautionProduct(name){
  const cur = state.caution[name] || { checked:false, qty:'' };
  cur.checked = !cur.checked;
  if(cur.checked && !cur.qty) cur.qty = '1';
  state.caution[name] = cur;
  renderCautionProducts();
  saveDraft();
}

function renderCautionProducts(){
  const wrap = document.getElementById('cautionList');
  if(!wrap) return;
  wrap.innerHTML = '';
  CAUTION_PRODUCTS.forEach(name=>{
    const entry = state.caution[name] || { checked:false, qty:'' };
    const row = buildDelivRow(name, entry,
      ()=> toggleCautionProduct(name),
      (val)=>{
        const cur = state.caution[name] || { checked:false, qty:'' };
        cur.qty = val;
        state.caution[name] = cur;
        saveDraft();
      }
    );
    wrap.appendChild(row);
  });

  const count = Object.values(state.caution).filter(p=>p.checked).length;
  const counterEl = document.getElementById('cautionCounter');
  counterEl.textContent = count;
  counterEl.style.display = count > 0 ? 'inline-block' : 'none';
}

/* ---------- Photos ---------- */

function compressImage(dataUrl, maxDim=1400, quality=0.72){
  return new Promise((resolve)=>{
    const img = new Image();
    img.onload = ()=>{
      let { width, height } = img;
      if(width > maxDim || height > maxDim){
        if(width > height){ height = Math.round(height * maxDim/width); width = maxDim; }
        else { width = Math.round(width * maxDim/height); height = maxDim; }
      }
      const canvas = document.createElement('canvas');
      canvas.width = width; canvas.height = height;
      canvas.getContext('2d').drawImage(img, 0, 0, width, height);
      try{ resolve(canvas.toDataURL('image/jpeg', quality)); }
      catch(e){ resolve(dataUrl); }
    };
    img.onerror = ()=> resolve(dataUrl);
    img.src = dataUrl;
  });
}

async function addPhotos(evt){
  const files = Array.from(evt.target.files || []);
  evt.target.value = '';
  for(const f of files){
    const raw = await new Promise((resolve)=>{
      const reader = new FileReader();
      reader.onload = e=> resolve(e.target.result);
      reader.readAsDataURL(f);
    });
    const compressed = await compressImage(raw);
    state.photos.push(compressed);
    renderPhotos();
    saveDraft();
  }
}
function renderPhotos(){
  const grid = document.getElementById('photoGrid');
  grid.querySelectorAll('.photo-thumb').forEach(n=>n.remove());
  state.photos.forEach((src, i)=>{
    const t = document.createElement('div');
    t.className = 'photo-thumb';
    t.innerHTML = `<img src="${src}"><div class="del" onclick="removePhoto(${i})">✕</div>`;
    grid.insertBefore(t, grid.firstChild);
  });
}
function removePhoto(i){ state.photos.splice(i,1); renderPhotos(); saveDraft(); }

/* ---------- Brouillons (sauvegarde automatique, plusieurs possibles) ---------- */

const DRAFTS_KEY = 'fiche_drafts';
let draftSaveTimer = null;

function loadDrafts(){
  try{ return JSON.parse(localStorage.getItem(DRAFTS_KEY) || '[]'); }
  catch(e){ return []; }
}
function saveDrafts(list){
  try{ localStorage.setItem(DRAFTS_KEY, JSON.stringify(list)); }catch(e){}
}
function getDraft(id){
  return loadDrafts().find(d=>d.id===id) || null;
}

function saveDraft(){
  clearTimeout(draftSaveTimer);
  draftSaveTimer = setTimeout(()=> saveDraftNow(), 500);
}

function saveDraftNow(){
  if(state.screen !== 'form') return;
  if(!hasUnsavedData()) return;
  const data = gatherData();
  data.savedAt = new Date().toISOString();
  const list = loadDrafts();
  if(state.draftId){
    const idx = list.findIndex(d=>d.id===state.draftId);
    data.id = state.draftId;
    if(idx >= 0) list[idx] = data; else list.unshift(data);
  } else {
    data.id = 'draft_' + Date.now() + '_' + Math.random().toString(36).slice(2,7);
    state.draftId = data.id;
    list.unshift(data);
  }
  saveDrafts(list);
}

function deleteDraft(id){
  saveDrafts(loadDrafts().filter(d=>d.id!==id));
  if(state.draftId === id) state.draftId = null;
}

function renderDraftBanner(){
  const drafts = loadDrafts();
  const section = document.getElementById('draftsSection');
  const wrap = document.getElementById('draftsList');
  if(drafts.length===0){ wrap.innerHTML=''; section.style.display='none'; return; }
  section.style.display = 'block';
  wrap.innerHTML = drafts.map(d=>`
    <div class="card draft-card">
      <div class="draft-info">
        <div class="draft-title">${escapeHtml(TYPE_LABELS[d.type] || '')} — ${escapeHtml(d.client || 'client non renseigné')}</div>
        <div class="draft-sub">non terminée</div>
      </div>
      <div style="display:flex; gap:8px;">
        <button class="btn btn-primary" style="padding:9px 14px; flex:none;" onclick="resumeDraft('${d.id}')">Reprendre</button>
        <button class="btn btn-secondary" style="padding:9px 14px; flex:none;" onclick="discardDraft('${d.id}')">Supprimer</button>
      </div>
    </div>
  `).join('');
}

function populateFormFrom(data, draftId, historyId){
  state.type = data.type;
  state.draftId = draftId || null;
  state.historyId = historyId || null;
  state.checkedTasks = {};
  (TASKS[data.type] || []).forEach((t,i)=>{
    const found = (data.tasksDoneAll || []).find(x=>x.text===t);
    if(found && found.checked) state.checkedTasks[i] = true;
  });
  state.selectedTechs = data.techs || [];
  state.photos = data.photos || [];
  state.hivernageType = data.hivernageType || '';
  state.devisNeeded = !!data.devisNeeded;
  state.delivery = data.delivery || {};
  state.caution = data.caution || {};

  state.screen = 'form';
  showScreen();

  document.getElementById('clientName').value = data.client || '';
  document.getElementById('clientStreet').value = data.street || '';
  document.getElementById('clientPostal').value = data.postal || '';
  document.getElementById('clientCity').value = data.city || '';
  document.getElementById('description').value = data.description || '';
  document.getElementById('remarks').value = data.remarks || '';
  document.getElementById('devisDetail').value = data.devisDetail || '';
  document.getElementById('fDate').value = data.date || new Date().toISOString().slice(0,10);
  document.getElementById('fDurationInput').value = data.durationRaw || '00:00';

  document.getElementById('matList').innerHTML = '';
  if(data.materials && data.materials.length){
    data.materials.forEach(m=> addMatRow(m.name, m.qty));
  } else {
    addMatRow();
  }

  document.getElementById('deliveryOtherList').innerHTML = '';
  let otherRows = [];
  if(Array.isArray(data.deliveryOther)){
    otherRows = data.deliveryOther;
  } else if(data.deliveryOther && data.deliveryOther.checked && data.deliveryOther.text){
    // compatibilité avec l'ancien format (une seule ligne "Autre")
    otherRows = [{ text: data.deliveryOther.text, qty: data.deliveryOther.qty }];
  }
  otherRows.forEach(o => addDeliveryOtherRow(o.text, o.qty));
  updateDeliveryCounter();

  renderPhotos();
  applyDevisUI();
  saveDraftNow();
}

function resumeDraft(id){
  const draft = getDraft(id);
  if(!draft) return;
  populateFormFrom(draft, id);
}

function discardDraft(id){
  if(!window.confirm('Supprimer cette fiche non terminée ?')) return;
  deleteDraft(id);
  renderDraftBanner();
}

/* ---------- Mémoire clients (autocomplétion) ---------- */

const CLIENTS_KEY = 'fiche_clients';
const CLIENTS_LIMIT = 200;

function loadClients(){
  try{ return JSON.parse(localStorage.getItem(CLIENTS_KEY) || '[]'); }
  catch(e){ return []; }
}

function upsertClient(name, street, postal, city){
  name = (name || '').trim();
  if(!name) return;
  const list = loadClients();
  const idx = list.findIndex(c => c.name.toLowerCase() === name.toLowerCase());
  const entry = { name, street: street||'', postal: postal||'', city: city||'', lastUsed: Date.now() };
  if(idx >= 0) list[idx] = entry; else list.push(entry);
  list.sort((a,b)=> b.lastUsed - a.lastUsed);
  try{ localStorage.setItem(CLIENTS_KEY, JSON.stringify(list.slice(0, CLIENTS_LIMIT))); }catch(e){}
  renderClientDatalist();
}

function findClient(name){
  name = (name || '').trim().toLowerCase();
  if(!name) return null;
  return loadClients().find(c => c.name.toLowerCase() === name) || null;
}

function renderClientDatalist(){
  const dl = document.getElementById('clientNameList');
  if(!dl) return;
  dl.innerHTML = loadClients().map(c => `<option value="${escapeHtml(c.name)}"></option>`).join('');
}

function onClientNameInput(){
  const nameField = document.getElementById('clientName');
  const client = findClient(nameField.value);
  if(!client) return;
  const streetField = document.getElementById('clientStreet');
  const postalField = document.getElementById('clientPostal');
  const cityField = document.getElementById('clientCity');
  // Ne pas écraser une adresse déjà saisie manuellement
  if(!streetField.value.trim() && !postalField.value.trim() && !cityField.value.trim()){
    streetField.value = client.street;
    postalField.value = client.postal;
    cityField.value = client.city;
    showToast('Adresse du client pré-remplie');
    saveDraft();
  }
}

/* ---------- History ---------- */

const HISTORY_LIMIT = 25;

function loadHistory(){
  let h;
  try{ h = JSON.parse(localStorage.getItem('fiche_history') || '[]'); }
  catch(e){ return []; }
  let migrated = false;
  h.forEach(e=>{
    if(!e.id){ e.id = 'hist_' + Date.now() + '_' + Math.random().toString(36).slice(2,7); migrated = true; }
  });
  if(migrated){
    try{ localStorage.setItem('fiche_history', JSON.stringify(h)); }catch(err){}
  }
  return h;
}

async function shrinkForHistory(photos){
  const out = [];
  for(const p of (photos || [])){
    out.push(await compressImage(p, 900, 0.55));
  }
  return out;
}

const STATUS_RANK = { saved: 1, pdf: 2, sent: 3 };
const STATUS_LABELS = {
  saved: { text: 'Enregistrée', bg: '#EBEEF0', color: 'var(--ink-soft)' },
  pdf:   { text: 'PDF généré', bg: '#DCEEF0', color: 'var(--teal-deep)' },
  sent:  { text: 'Envoyée ✓', bg: '#E1F3E8', color: 'var(--ok)' },
};

async function saveToHistory(data, status){
  status = status || 'saved';
  const entry = Object.assign({}, data);
  entry.photos = await shrinkForHistory(data.photos);
  entry.savedAt = new Date().toISOString();
  const h = loadHistory();

  if(state.historyId){
    const idx = h.findIndex(e=>e.id===state.historyId);
    entry.id = state.historyId;
    const prevStatus = idx >= 0 ? h[idx].status : null;
    const prevRank = STATUS_RANK[prevStatus] || 0;
    entry.status = (STATUS_RANK[status] > prevRank) ? status : (prevStatus || status);
    if(idx >= 0){ h[idx] = entry; } else { h.unshift(entry); }
  } else {
    entry.id = 'hist_' + Date.now() + '_' + Math.random().toString(36).slice(2,7);
    entry.status = status;
    state.historyId = entry.id;
    h.unshift(entry);
  }

  try{
    localStorage.setItem('fiche_history', JSON.stringify(h.slice(0, HISTORY_LIMIT)));
  }catch(e){
    // storage full — drop photos from history entries and retry
    const lean = h.slice(0, HISTORY_LIMIT).map(e2=>({...e2, photos:[]}));
    try{ localStorage.setItem('fiche_history', JSON.stringify(lean)); }catch(e2){}
  }
  upsertClient(data.client, data.street, data.postal, data.city);
  renderHistory();
}

function bumpHistoryStatus(id, status){
  if(!id) return;
  const h = loadHistory();
  const idx = h.findIndex(e=>e.id===id);
  if(idx < 0) return;
  const prevRank = STATUS_RANK[h[idx].status] || 0;
  if(STATUS_RANK[status] > prevRank){
    h[idx].status = status;
    try{ localStorage.setItem('fiche_history', JSON.stringify(h)); }catch(e){}
    renderHistory();
  }
}

let historySearchQuery = '';
let historyTypeFilterValue = '';
let typeFilterOptionsBuilt = false;

function onHistorySearch(val){
  historySearchQuery = (val || '').trim().toLowerCase();
  renderHistory();
}

function onHistoryTypeFilter(val){
  historyTypeFilterValue = val || '';
  renderHistory();
}

function buildTypeFilterOptions(){
  if(typeFilterOptionsBuilt) return;
  const sel = document.getElementById('historyTypeFilter');
  if(!sel) return;
  Object.keys(TYPE_LABELS).forEach(key=>{
    const opt = document.createElement('option');
    opt.value = key;
    opt.textContent = TYPE_LABELS[key];
    sel.appendChild(opt);
  });
  typeFilterOptionsBuilt = true;
}

function renderHistory(){
  buildTypeFilterOptions();
  const all = loadHistory();
  let h = all;
  if(historySearchQuery) h = h.filter(item => (item.client || '').toLowerCase().includes(historySearchQuery));
  if(historyTypeFilterValue) h = h.filter(item => item.type === historyTypeFilterValue);

  const wrap = document.getElementById('histList');
  const filtersBox = document.getElementById('historyFilters');
  if(filtersBox) filtersBox.style.display = all.length > 3 ? 'flex' : 'none';

  renderStorageIndicator();

  if(all.length===0){ wrap.innerHTML = '<div class="mono" style="font-size:12px;color:var(--ink-soft);">aucune fiche enregistrée</div>'; return; }
  if(h.length===0){ wrap.innerHTML = '<div class="mono" style="font-size:12px;color:var(--ink-soft);">aucun résultat</div>'; return; }

  wrap.innerHTML = '';
  h.forEach((item)=>{
    const el = document.createElement('div');
    el.className = 'hist-item';
    const canReview = !!item.tasksDoneAll;
    const st = STATUS_LABELS[item.status] || STATUS_LABELS.saved;
    el.innerHTML = `<div>
        <div class="t">${escapeHtml(item.client || 'Client')} — ${escapeHtml(TYPE_LABELS[item.type] || '')}</div>
        <div class="d">${item.date || ''}</div>
        <span class="status-pill" style="background:${st.bg}; color:${st.color};">${st.text}</span>
      </div>
      <div style="display:flex; gap:6px; align-items:center;">
        ${canReview ? `<button class="icon-btn" title="Ouvrir" onclick="reviewHistoryItem('${item.id}')">✏️</button>` : ''}
        ${canReview ? `<button class="icon-btn" title="Générer le PDF" onclick="quickGeneratePDF('${item.id}')">📄</button>` : ''}
        ${canReview ? `<button class="icon-btn" title="Envoyer par mail" onclick="quickSendFiche('${item.id}')">✉️</button>` : ''}
        <button class="icon-btn icon-btn-danger" title="Supprimer" onclick="deleteHist('${item.id}')">🗑</button>
      </div>`;
    wrap.appendChild(el);
  });
}

/* ---------- Indicateur de stockage ---------- */

function getStorageUsageMB(){
  let bytes = 0;
  for(let i=0; i<localStorage.length; i++){
    const key = localStorage.key(i);
    const val = localStorage.getItem(key) || '';
    bytes += new Blob([key + val]).size;
  }
  return bytes / (1024*1024);
}

function renderStorageIndicator(){
  const wrap = document.getElementById('storageIndicator');
  if(!wrap) return;
  const usedMB = getStorageUsageMB();
  const capMB = 5; // repère indicatif — la limite réelle varie selon l'appareil
  const pct = Math.min(100, Math.round((usedMB / capMB) * 100));
  let barColor = 'var(--ok)';
  if(pct >= 85) barColor = 'var(--danger)';
  else if(pct >= 60) barColor = 'var(--amber)';

  wrap.innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:center; font-size:11px; color:var(--ink-soft); margin-bottom:4px;">
      <span>Stockage utilisé sur cet iPad</span>
      <span>${usedMB.toFixed(1)} Mo</span>
    </div>
    <div style="height:6px; background:var(--line); border-radius:4px; overflow:hidden;">
      <div style="height:100%; width:${pct}%; background:${barColor};"></div>
    </div>
    ${pct >= 80 ? `<div style="font-size:11px; color:var(--danger); margin-top:5px;">Stockage presque plein — pense à supprimer les anciennes fiches de l'historique.</div>` : ''}
  `;
}

function reviewHistoryItem(id){
  const item = loadHistory().find(e=>e.id===id);
  if(!item) return;
  populateFormFrom(item, null, item.id || null);
  showToast('Fiche ouverte — les photos sont en qualité réduite');
}

function deleteHist(id){
  const h = loadHistory().filter(e=>e.id!==id);
  try{ localStorage.setItem('fiche_history', JSON.stringify(h)); }catch(e){}
  renderHistory();
}

/* ---------- Durée (temps passé) ---------- */

function formatDuration(){
  const val = document.getElementById('fDurationInput').value || '00:00';
  const [hStr, mStr] = val.split(':');
  const h = parseInt(hStr, 10) || 0;
  const m = mStr || '00';
  return m === '00' ? `${h}h` : `${h}h${m}`;
}

/* ---------- Gather form data ---------- */

function gatherData(){
  const mats = Array.from(document.querySelectorAll('#matList .mat-row')).map(row=>{
    const inputs = row.querySelectorAll('input');
    return {name: inputs[0].value.trim(), qty: inputs[1].value.trim()};
  }).filter(m=>m.name);

  const deliveryOther = Array.from(document.querySelectorAll('#deliveryOtherList .mat-row')).map(row=>{
    const inputs = row.querySelectorAll('input');
    return {text: inputs[0].value.trim(), qty: inputs[1].value.trim()};
  }).filter(o=>o.text);

  const tasksDoneAll = TASKS[state.type].map((t,i)=>({text:t, checked: !!state.checkedTasks[i]}));

  return {
    type: state.type,
    typeLabel: TYPE_LABELS[state.type],
    client: document.getElementById('clientName').value.trim(),
    street: document.getElementById('clientStreet').value.trim(),
    postal: document.getElementById('clientPostal').value.trim(),
    city: document.getElementById('clientCity').value.trim(),
    date: document.getElementById('fDate').value,
    duration: formatDuration(),
    durationRaw: document.getElementById('fDurationInput').value,
    techs: state.selectedTechs.slice(),
    tasksDoneAll,
    description: document.getElementById('description').value.trim(),
    materials: mats,
    photos: state.photos.slice(),
    remarks: document.getElementById('remarks').value.trim(),
    hivernageType: state.hivernageType,
    delivery: JSON.parse(JSON.stringify(state.delivery)),
    deliveryOther,
    caution: JSON.parse(JSON.stringify(state.caution)),
    devisNeeded: state.devisNeeded,
    devisDetail: document.getElementById('devisDetail').value.trim(),
    companyName: settings.companyName,
    companyAddress: settings.companyAddress,
    companyPhone: settings.companyPhone,
    companyTVA: settings.companyTVA,
  };
}

/* ---------- PDF generation ---------- */

function buildPDF(data){
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({unit:'mm', format:'a4'});
  const margin = 16;
  let y = 18;
  const pageW = 210;
  const pageH = 297;
  const BLUE = [46,134,193];
  const BLUE_DEEP = [19,74,109];
  const INK = [14,33,38];
  const INK_SOFT = [110,128,131];
  const AMBER = [226,154,60];
  const LINE_GRAY = [222,231,233];

  // ---- header band ----
  doc.setFillColor(...BLUE_DEEP);
  doc.rect(0,0,pageW,28,'F');
  doc.setFillColor(...BLUE);
  doc.rect(0,24,pageW,4,'F');

  const logoImg = document.querySelector('.brand-mark img');
  if(logoImg && logoImg.src){
    try{ doc.addImage(logoImg.src, 'PNG', margin, 5, 16, 16); }catch(e){}
  }
  const textX = margin + 21;
  doc.setTextColor(255,255,255);
  doc.setFont('helvetica','bold');
  doc.setFontSize(14);
  doc.text(data.companyName || "Fiche d'intervention", textX, 12);
  doc.setFont('helvetica','normal');
  doc.setFontSize(9);
  doc.text('piscines & wellness', textX, 17.5);

  doc.setFont('helvetica','bold');
  doc.setFontSize(11);
  let title = 'FICHE ' + data.typeLabel.toUpperCase();
  if(data.type === 'hivernage' && data.hivernageType) title += '  ·  ' + data.hivernageType;
  doc.text(title, pageW - margin, 12, {align:'right'});
  doc.setFont('helvetica','normal');
  doc.setFontSize(9);
  doc.text(data.date || '', pageW - margin, 17.5, {align:'right'});

  y = 38;
  doc.setTextColor(...INK);

  function section(title){
    doc.setFont('helvetica','bold'); doc.setFontSize(11);
    doc.setTextColor(...BLUE_DEEP);
    doc.text(title.toUpperCase(), margin, y);
    doc.setDrawColor(...BLUE);
    doc.setLineWidth(0.5);
    doc.line(margin, y+1.8, pageW-margin, y+1.8);
    y += 7.5;
    doc.setTextColor(...INK);
    doc.setFont('helvetica','normal'); doc.setFontSize(10);
  }
  function line(txt){
    const split = doc.splitTextToSize(txt, pageW - margin*2);
    split.forEach(ln=>{
      if(y > pageH - 14){ doc.addPage(); y = 18; }
      doc.text(ln, margin, y);
      y += 5;
    });
    y += 2;
  }
  function checkPage(needed=20){
    if(y > pageH - needed){ doc.addPage(); y = 18; return true; }
    return false;
  }
  function taskLine(text, checked){
    checkPage(11);
    const boxSize = 4.2;
    doc.setDrawColor(...BLUE);
    doc.setLineWidth(0.4);
    if(checked){
      doc.setFillColor(...BLUE);
      doc.roundedRect(margin, y-3.6, boxSize, boxSize, 0.8, 0.8, 'FD');
      doc.setDrawColor(255,255,255);
      doc.setLineWidth(0.6);
      doc.line(margin+0.8, y-1.7, margin+1.7, y-0.6);
      doc.line(margin+1.7, y-0.6, margin+3.4, y-3.1);
    } else {
      doc.roundedRect(margin, y-3.6, boxSize, boxSize, 0.8, 0.8, 'D');
    }
    doc.setTextColor(...INK);
    doc.setFont('helvetica','normal'); doc.setFontSize(10);
    const split = doc.splitTextToSize(text, pageW - margin*2 - 8);
    doc.text(split, margin + 7, y);
    y += Math.max(split.length*5, 6);
  }

  section('Client');
  line((data.client || '—'));
  line(data.street || '—');
  line([data.postal, data.city].filter(Boolean).join(' ') || '—');

  checkPage();
  section('Intervention');
  line('Date : ' + (data.date || '—'));
  line('Temps passé : ' + (data.duration || '—'));
  line('Technicien(s) : ' + (data.techs.length ? data.techs.join(', ') : '—'));
  if(data.type === 'hivernage' && data.hivernageType){
    line('Type d\'hivernage : ' + data.hivernageType);
  }

  const cfg = TYPE_CONFIG[data.type] || {};

  if(cfg.checklist){
    checkPage();
    section('Tâches effectuées');
    if(data.tasksDoneAll.length===0){
      line('Aucune tâche pour ce type de fiche.');
    } else {
      data.tasksDoneAll.forEach(t=> taskLine(t.text, t.checked));
    }
  }

  if(cfg.description){
    checkPage();
    section('Descriptif de l\'intervention');
    line(data.description || '—');
  }

  if(cfg.materiel && data.materials.length){
    checkPage();
    section('Matériel / produits utilisés');
    data.materials.forEach(m=>{ checkPage(10); line('•  ' + m.name + (m.qty ? '   (' + m.qty + ')' : '')); });
  }

  if(cfg.delivery){
    const deliveredList = Object.keys(data.delivery || {})
      .filter(name => data.delivery[name].checked)
      .map(name => ({ name, qty: data.delivery[name].qty }));
    if(Array.isArray(data.deliveryOther)){
      data.deliveryOther.forEach(o=>{ if(o.text) deliveredList.push({ name: o.text, qty: o.qty }); });
    } else if(data.deliveryOther && data.deliveryOther.checked && data.deliveryOther.text){
      // compatibilité avec l'ancien format (une seule ligne "Autre")
      deliveredList.push({ name: data.deliveryOther.text, qty: data.deliveryOther.qty });
    }
    checkPage();
    section('Produits livrés');
    if(deliveredList.length === 0){
      line('Aucun produit sélectionné.');
    } else {
      deliveredList.forEach(p=>{ checkPage(10); line('•  ' + p.name + (p.qty ? '   x' + p.qty : '')); });
    }

    const cautionList = Object.keys(data.caution || {})
      .filter(name => data.caution[name].checked)
      .map(name => ({ name, qty: data.caution[name].qty }));
    if(cautionList.length){
      checkPage();
      section('Cautions reprises');
      cautionList.forEach(p=>{ checkPage(10); line('•  ' + p.name + (p.qty ? '   x' + p.qty : '')); });
    }
  }

  if(data.photos.length){
    checkPage(60);
    section('Photos');
    const thumb = 42, gap = 4;
    let x = margin;
    let col = 0;
    data.photos.forEach((src)=>{
      if(col === 0 && checkPage(thumb + 6)){ x = margin; }
      const fmt = src.startsWith('data:image/png') ? 'PNG' : 'JPEG';
      try{ doc.addImage(src, fmt, x, y, thumb, thumb); }catch(e){}
      doc.setDrawColor(...LINE_GRAY);
      doc.rect(x, y, thumb, thumb, 'D');
      x += thumb + gap;
      col++;
      if(col === 4){ col = 0; x = margin; y += thumb + gap; }
    });
    if(col !== 0){ y += thumb + gap; }
  }

  if(data.remarks){
    checkPage();
    section('Remarques');
    line(data.remarks);
  }

  if(data.devisNeeded){
    checkPage(28);
    const bannerH = 8;
    doc.setFillColor(...AMBER);
    doc.roundedRect(margin, y-5.5, pageW-margin*2, bannerH, 1.2, 1.2, 'F');
    doc.setFont('helvetica','bold'); doc.setFontSize(10.5); doc.setTextColor(255,255,255);
    doc.text('DEMANDE DE DEVIS', margin+4, y-0.3);
    y += bannerH - 1;
    doc.setFont('helvetica','normal'); doc.setFontSize(10); doc.setTextColor(...INK);
    line(data.devisDetail || 'À établir — voir description ci-dessus.');
  }

  // footer on every page: company contact + page numbers
  const pageCount = doc.internal.getNumberOfPages();
  const footerParts = [data.companyAddress, data.companyPhone, data.companyTVA ? 'TVA ' + data.companyTVA : ''].filter(Boolean);
  for(let p=1; p<=pageCount; p++){
    doc.setPage(p);
    doc.setDrawColor(...LINE_GRAY);
    doc.setLineWidth(0.3);
    doc.line(margin, pageH-14, pageW-margin, pageH-14);
    doc.setFont('helvetica','normal'); doc.setFontSize(8); doc.setTextColor(...INK_SOFT);
    doc.text(footerParts.join('   ·   '), margin, pageH-9);
    doc.text(`Page ${p}/${pageCount}`, pageW-margin, pageH-9, {align:'right'});
  }

  return doc;
}

function backToHomeAfterSend(){
  if(state.draftId) deleteDraft(state.draftId);
  resetForm();
  state.screen = 'home';
  showScreen();
}

let formActionBusy = false;

function lockFormButtons(locked){
  formActionBusy = locked;
  ['btnSave','btnPdf','btnSend'].forEach(id=>{
    const btn = document.getElementById(id);
    if(btn) btn.disabled = locked;
  });
}

async function saveFiche(){
  if(formActionBusy) return;
  const data = gatherData();
  if(!data.client){ showToast("Indique le nom du client avant d'enregistrer"); return; }
  lockFormButtons(true);
  await saveToHistory(data, 'saved');
  showToast('Fiche enregistrée');
  backToHomeAfterSend();
  lockFormButtons(false);
}

async function generatePDF(silent){
  const data = gatherData();
  if(!data.client){ showToast("Indique le nom du client avant de générer le PDF"); return null; }
  if(!silent){
    if(formActionBusy) return null;
    lockFormButtons(true);
  }
  const doc = buildPDF(data);
  const filename = `Fiche_${data.typeLabel.replace(/\s/g,'')}_${data.client.replace(/\s/g,'_')}_${data.date||''}.pdf`;
  if(!silent){
    doc.save(filename);
    await saveToHistory(data, 'pdf');
    showToast('PDF téléchargé');
    backToHomeAfterSend();
    lockFormButtons(false);
  }
  return {doc, filename, data};
}

/* ---------- Send by email ---------- */

async function performSend(data){
  if(!settings.companyEmail){
    showToast("Ajoute l'adresse mail de la société dans les réglages ⚙");
    openSettings();
    return false;
  }

  const confirmMsg = `Envoyer la fiche ${data.typeLabel} — ${data.client || 'client'} à ${settings.companyEmail} ?`;
  if(!window.confirm(confirmMsg)) return false;

  const doc = buildPDF(data);
  const filename = `Fiche_${(data.typeLabel||'').replace(/\s/g,'')}_${(data.client||'').replace(/\s/g,'_')}_${data.date||''}.pdf`;
  const blob = doc.output('blob');
  const file = new File([blob], filename, {type:'application/pdf'});
  const summary = `Fiche ${data.typeLabel} — ${data.client}\nDate : ${data.date}\nTechnicien(s) : ${(data.techs||[]).join(', ')}\n\nFiche PDF en pièce jointe.`;

  // iOS/iPadOS Safari: Web Share API can hand the PDF straight to Mail (iCloud)
  // via the share sheet, with attachment.
  if(navigator.canShare && navigator.canShare({files:[file]})){
    try{
      await navigator.share({ files:[file], title: filename, text: summary });
      showToast('Fiche partagée — choisis Mail pour l\'envoyer');
      return true;
    }catch(e){
      // user cancelled the share sheet — fall through to mailto backup
      if(e && e.name === 'AbortError') return false;
    }
  }

  // Fallback: download the PDF and open a pre-filled mail (no attachment —
  // attach the just-downloaded PDF manually from the Fichiers app).
  doc.save(filename);
  const subject = encodeURIComponent(`Fiche ${data.typeLabel} — ${data.client}`);
  const body = encodeURIComponent(summary + '\n\n(PDF téléchargé — pense à le joindre depuis "Fichiers")');
  window.location.href = `mailto:${settings.companyEmail}?subject=${subject}&body=${body}`;
  showToast('PDF téléchargé — joins-le au mail qui s\'ouvre');
  return true;
}

async function sendFiche(){
  if(formActionBusy) return;
  const data = gatherData();
  if(!data.client){ showToast("Indique le nom du client avant d'envoyer"); return; }
  lockFormButtons(true);
  const sent = await performSend(data);
  if(!sent){ lockFormButtons(false); return; }
  await saveToHistory(data, 'sent');
  backToHomeAfterSend();
  lockFormButtons(false);
}

async function quickSendFiche(id){
  const item = loadHistory().find(e=>e.id===id);
  if(!item) return;
  const sent = await performSend(item);
  if(sent) bumpHistoryStatus(item.id, 'sent');
}

function quickGeneratePDF(id){
  const item = loadHistory().find(e=>e.id===id);
  if(!item) return;
  const doc = buildPDF(item);
  const filename = `Fiche_${(item.typeLabel||'').replace(/\s/g,'')}_${(item.client||'').replace(/\s/g,'_')}_${item.date||''}.pdf`;
  doc.save(filename);
  bumpHistoryStatus(item.id, 'pdf');
  showToast('PDF téléchargé');
}

/* ---------- Toast ---------- */
let toastTimer;
function showToast(msg){
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(()=>t.classList.remove('show'), 2600);
}

/* ---------- Init ---------- */

window.addEventListener('DOMContentLoaded', ()=>{
  refreshHeader();
  document.getElementById('fDate').value = new Date().toISOString().slice(0,10);
  renderTiles();
  addMatRow();
  renderPhotos();
  renderHistory();
  renderClientDatalist();
  showScreen();

  const formEl = document.getElementById('formScreen');
  formEl.addEventListener('input', saveDraft);
  formEl.addEventListener('change', saveDraft);
  document.getElementById('clientName').addEventListener('input', onClientNameInput);

  if('serviceWorker' in navigator){
    navigator.serviceWorker.register('./sw.js').catch(()=>{});
  }
});
