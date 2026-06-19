// ═══════════════════════════════════════════════════════════
// FICHES D'INTERVENTION
// ═══════════════════════════════════════════════════════════
const FICHES = {
  render() {
    const user = AUTH.getUser();
    const fiches = DB.getAll('fiches');
    const el = document.getElementById('page-fiches');
    el.innerHTML = `
    <div class="page-header">
      <div>
        <div class="page-title">Fiches d'intervention</div>
        <div class="page-subtitle">${fiches.length} fiches au total</div>
      </div>
      <div style="display:flex;gap:8px">
        <select class="form-control" id="fiche-filter-type" style="width:160px" onchange="FICHES.renderList()">
          <option value="">Tous types</option>
          <option value="mis">Mise en service</option>
          <option value="hiv">Hivernage</option>
          <option value="sav">SAV</option>
          <option value="int">Intervention</option>
        </select>
        <select class="form-control" id="fiche-filter-state" style="width:140px" onchange="FICHES.renderList()">
          <option value="">Tous états</option>
          <option value="draft">Brouillon</option>
          <option value="in_progress">En cours</option>
          <option value="done">Validée</option>
          <option value="invoiced">Facturée</option>
        </select>
        <button class="btn btn-primary" onclick="FICHES.openNew()">+ Nouvelle fiche</button>
      </div>
    </div>
    <div id="fiches-list"></div>
    ${this.modalHtml()}`;
    this.renderList();
  },

  renderList() {
    const typeFilter = document.getElementById('fiche-filter-type')?.value||'';
    const stateFilter = document.getElementById('fiche-filter-state')?.value||'';
    const user = AUTH.getUser();
    let fiches = DB.getAll('fiches');
    if (user.role === 'technicien') fiches = fiches.filter(f => f.technician_id === user.id);
    if (typeFilter) fiches = fiches.filter(f => f.type === typeFilter);
    if (stateFilter) fiches = fiches.filter(f => f.state === stateFilter);
    fiches.sort((a,b) => b.date?.localeCompare(a.date||'')||0);

    document.getElementById('fiches-list').innerHTML = `
    <div class="card">
      <div class="table-wrap">
        <table>
          <thead><tr><th>Référence</th><th>Type</th><th>Client</th><th>Technicien</th><th>Date</th><th>Durée</th><th>État</th><th></th></tr></thead>
          <tbody>
            ${fiches.map(f => {
              const client = DB.getById('clients', f.client_id);
              const tech = DB.getById('users', f.technician_id);
              const duration = f.time_end && f.time_start ? (f.time_end - f.time_start).toFixed(1) + 'h' : '—';
              return `<tr>
                <td><strong>${f.reference}</strong></td>
                <td>${U.FICHE_LABELS[f.type]||f.type}</td>
                <td>${client?.name||'—'}</td>
                <td>${tech ? `<div style="display:flex;align-items:center;gap:6px"><div class="user-avatar" style="background:${tech.color};width:24px;height:24px;font-size:10px">${U.initials(tech.name)}</div>${tech.name}</div>` : '—'}</td>
                <td>${U.fmtDate(f.date)}</td>
                <td>${duration}</td>
                <td>${U.stateBadge(f.state)}</td>
                <td><button class="btn btn-ghost btn-sm" onclick="FICHES.openEdit('${f.id}')">✏️ Ouvrir</button></td>
              </tr>`;
            }).join('') || '<tr><td colspan="8" style="text-align:center;padding:30px;color:var(--text-muted)">Aucune fiche trouvée</td></tr>'}
          </tbody>
        </table>
      </div>
    </div>`;
  },

  genRef(type) {
    const prefixes = { mis:'MES', hiv:'HIV', sav:'SAV', int:'INT' };
    const year = new Date().getFullYear();
    const fiches = DB.getAll('fiches').filter(f => f.type === type);
    const num = String(fiches.length + 1).padStart(4, '0');
    return `${prefixes[type]||'INT'}/${year}/${num}`;
  },

  openNew(clientId = '') {
    const clients = DB.getAll('clients');
    const users = DB.getAll('users').filter(u => u.role === 'technicien' && u.active);
    const currentUser = AUTH.getUser();
    document.getElementById('modal-fiche').classList.add('open');
    document.getElementById('modal-fiche-title').textContent = 'Nouvelle fiche';
    document.getElementById('form-fiche').reset();
    document.getElementById('ff-id').value = '';
    document.getElementById('ff-date').value = U.today();
    document.getElementById('ff-client').value = clientId;
    if (currentUser.role === 'technicien') document.getElementById('ff-tech').value = currentUser.id;
    this.updateChecklist();
  },

  openEdit(id) {
    const f = DB.getById('fiches', id);
    if (!f) return;
    document.getElementById('modal-fiche').classList.add('open');
    document.getElementById('modal-fiche-title').textContent = `Fiche ${f.reference}`;
    document.getElementById('ff-id').value = f.id;
    document.getElementById('ff-type').value = f.type;
    document.getElementById('ff-client').value = f.client_id||'';
    document.getElementById('ff-tech').value = f.technician_id||'';
    document.getElementById('ff-date').value = f.date||'';
    document.getElementById('ff-start').value = f.time_start||'';
    document.getElementById('ff-end').value = f.time_end||'';
    document.getElementById('ff-km').value = f.km||'';
    document.getElementById('ff-description').value = f.description||'';
    document.getElementById('ff-work').value = f.work_done||'';
    document.getElementById('ff-obs').value = f.observations||'';
    document.getElementById('ff-planned').value = f.work_planned||'';
    document.getElementById('ff-ph').value = f.water_ph||'';
    document.getElementById('ff-chlore').value = f.water_chlore||'';
    document.getElementById('ff-state').value = f.state||'draft';
    this.updateChecklist(f);
    this.renderLines(f.lines||[]);
  },

  updateChecklist(fiche = null) {
    const type = document.getElementById('ff-type').value;
    const checks = {
      mis: ['Étanchéité bassin vérifiée','Mise en eau terminée','Pompe amorcée et démarrée','Débit et pression filtre OK','Vanne multivoies réglée','Skimmers et buses vérifiés','Chauffage vérifié','Robot démarré','Traitement automatique en route','Horloge programmée'],
      hiv: ['Analyse eau effectuée','Traitement choc hivernage','Algicide hivernal ajouté','Vidange partielle effectuée','Purge canalisations','Bouchons skimmers posés','Bouchons buses posés','Pompe purgée et protégée','Filtre purgé','Chauffage hiverné','Accessoires rangés','Bâche posée et fixée'],
      sav: ['Pompe vérifiée / remplacée','Filtre vérifié','Canalisations OK','Eau analysée et corrigée','Installation électrique OK','Robot vérifié','Test de fonctionnement final','Client informé et approuve'],
      int: ['État général vérifié','Équipements contrôlés','Nettoyage effectué','Eau analysée et corrigée','Test final effectué','Client informé'],
    };
    const items = checks[type] || [];
    const done = fiche?.checklist || [];
    document.getElementById('ff-checklist').innerHTML = items.map((item,i) =>
      `<div class="check-item ${done.includes(i)?'checked':''}">
        <input type="checkbox" id="chk-${i}" ${done.includes(i)?'checked':''} onchange="this.closest('.check-item').classList.toggle('checked',this.checked)">
        <label for="chk-${i}">${item}</label>
      </div>`
    ).join('');
  },

  renderLines(lines) {
    const products = DB.getAll('products');
    document.getElementById('ff-lines').innerHTML = `
      <table style="width:100%;font-size:13px">
        <thead><tr><th>Produit</th><th>Qté</th><th>Prix HT</th><th>Total</th><th></th></tr></thead>
        <tbody id="ff-lines-body">
          ${lines.map((l,i) => {
            const p = DB.getById('products', l.product_id);
            return `<tr>
              <td>${p?.name||l.product_id}</td>
              <td>${l.qty}</td>
              <td>${U.fmtEur(l.price)}</td>
              <td>${U.fmtEur(l.qty*l.price)}</td>
              <td><button class="btn btn-ghost btn-sm" onclick="FICHES.removeLine(${i})">🗑️</button></td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>
      <div style="display:flex;gap:8px;margin-top:8px">
        <select class="form-control" id="ff-add-product" style="flex:1">
          <option value="">Choisir un produit...</option>
          ${products.map(p=>`<option value="${p.id}">${p.name} (${p.qty} ${p.unit})</option>`).join('')}
        </select>
        <input class="form-control" id="ff-add-qty" type="number" min="1" value="1" style="width:80px">
        <button class="btn btn-ghost" onclick="FICHES.addLine()">+ Ajouter</button>
      </div>`;
    this._lines = lines;
  },

  addLine() {
    const productId = document.getElementById('ff-add-product').value;
    const qty = parseInt(document.getElementById('ff-add-qty').value)||1;
    if (!productId) return;
    const p = DB.getById('products', productId);
    if (!this._lines) this._lines = [];
    this._lines.push({ product_id: productId, qty, price: p.price_sell||0 });
    this.renderLines(this._lines);
  },

  removeLine(i) {
    this._lines.splice(i, 1);
    this.renderLines(this._lines);
  },

  save() {
    const id = document.getElementById('ff-id').value || DB.genId();
    const type = document.getElementById('ff-type').value;
    const checklist = [...document.querySelectorAll('#ff-checklist input:checked')].map(i => parseInt(i.id.split('-')[1]));
    const fiche = {
      id,
      reference: DB.getById('fiches', id)?.reference || this.genRef(type),
      type,
      state: document.getElementById('ff-state').value,
      client_id: document.getElementById('ff-client').value,
      technician_id: document.getElementById('ff-tech').value,
      date: document.getElementById('ff-date').value,
      time_start: parseFloat(document.getElementById('ff-start').value)||null,
      time_end: parseFloat(document.getElementById('ff-end').value)||null,
      km: parseFloat(document.getElementById('ff-km').value)||null,
      description: document.getElementById('ff-description').value,
      work_done: document.getElementById('ff-work').value,
      observations: document.getElementById('ff-obs').value,
      work_planned: document.getElementById('ff-planned').value,
      water_ph: parseFloat(document.getElementById('ff-ph').value)||null,
      water_chlore: parseFloat(document.getElementById('ff-chlore').value)||null,
      checklist,
      lines: this._lines || [],
      created_at: U.today(),
    };

    // Déduire du stock si validée
    if (fiche.state === 'done' && fiche.lines?.length) {
      fiche.lines.forEach(l => {
        const p = DB.getById('products', l.product_id);
        if (p) { p.qty = Math.max(0, p.qty - l.qty); DB.save('products', p); }
      });
    }

    DB.save('fiches', fiche);
    U.closeModal('modal-fiche');
    FICHES.render();
    U.toast('Fiche enregistrée', 'success');
  },

  modalHtml() {
    const clients = DB.getAll('clients');
    const users = DB.getAll('users').filter(u => u.role === 'technicien' && u.active);
    const currentUser = AUTH.getUser();
    return `
    <div class="modal-overlay" id="modal-fiche">
      <div class="modal-box modal-lg">
        <div class="modal-header">
          <div class="modal-title" id="modal-fiche-title">Fiche d'intervention</div>
          <button class="modal-close" onclick="U.closeModal('modal-fiche')">×</button>
        </div>
        <div class="modal-body" style="padding:0">
          <div style="padding:16px 24px;border-bottom:1px solid var(--border);display:flex;gap:12px;flex-wrap:wrap">
            <select class="form-control" id="ff-type" style="width:180px" onchange="FICHES.updateChecklist()">
              <option value="int">⚙️ Intervention</option>
              <option value="mis">🔧 Mise en service</option>
              <option value="hiv">❄️ Hivernage</option>
              <option value="sav">🚨 SAV</option>
            </select>
            <select class="form-control" id="ff-state" style="width:150px">
              <option value="draft">Brouillon</option>
              <option value="in_progress">En cours</option>
              <option value="done">Validée</option>
              <option value="invoiced">Facturée</option>
            </select>
            <select class="form-control" id="ff-client" style="flex:1;min-width:180px">
              <option value="">— Client —</option>
              ${clients.map(c=>`<option value="${c.id}">${c.name}</option>`).join('')}
            </select>
            <select class="form-control" id="ff-tech" style="width:180px" ${currentUser.role==='technicien'?'disabled':''}>
              <option value="">— Technicien —</option>
              ${users.map(u=>`<option value="${u.id}">${u.name}</option>`).join('')}
            </select>
          </div>
          <form id="form-fiche" onsubmit="event.preventDefault()">
            <input type="hidden" id="ff-id">
            <div style="display:grid;grid-template-columns:1fr 1fr;border-bottom:1px solid var(--border)">
              <div style="padding:20px 24px;border-right:1px solid var(--border)">
                <div style="font-size:12px;font-weight:700;text-transform:uppercase;color:var(--text-muted);margin-bottom:12px">Intervention</div>
                <div class="form-row">
                  <div class="form-group"><label class="form-label">Date</label><input class="form-control" id="ff-date" type="date"></div>
                  <div class="form-group"><label class="form-label">Km déplacement</label><input class="form-control" id="ff-km" type="number" step=".1"></div>
                </div>
                <div class="form-row">
                  <div class="form-group"><label class="form-label">Heure début</label><input class="form-control" id="ff-start" type="number" step=".25" placeholder="8.5 = 8h30"></div>
                  <div class="form-group"><label class="form-label">Heure fin</label><input class="form-control" id="ff-end" type="number" step=".25"></div>
                </div>
                <div class="form-group"><label class="form-label">Panne / Demande signalée</label><textarea class="form-control" id="ff-description" rows="2"></textarea></div>
                <div class="form-group"><label class="form-label">Travaux réalisés</label><textarea class="form-control" id="ff-work" rows="3"></textarea></div>
                <div class="form-group"><label class="form-label">Observations</label><textarea class="form-control" id="ff-obs" rows="2"></textarea></div>
                <div class="form-group"><label class="form-label">Travaux à prévoir</label><textarea class="form-control" id="ff-planned" rows="2"></textarea></div>
                <div class="form-row">
                  <div class="form-group"><label class="form-label">pH</label><input class="form-control" id="ff-ph" type="number" step=".1" placeholder="7.2"></div>
                  <div class="form-group"><label class="form-label">Chlore libre (mg/L)</label><input class="form-control" id="ff-chlore" type="number" step=".1"></div>
                </div>
              </div>
              <div style="padding:20px 24px">
                <div style="font-size:12px;font-weight:700;text-transform:uppercase;color:var(--text-muted);margin-bottom:12px">Checklist</div>
                <div class="checklist" id="ff-checklist"></div>
              </div>
            </div>
            <div style="padding:20px 24px">
              <div style="font-size:12px;font-weight:700;text-transform:uppercase;color:var(--text-muted);margin-bottom:12px">Pièces & Produits utilisés</div>
              <div id="ff-lines"></div>
            </div>
          </form>
        </div>
        <div class="modal-footer">
          <button class="btn btn-ghost" onclick="U.closeModal('modal-fiche')">Annuler</button>
          <button class="btn btn-primary" onclick="FICHES.save()">💾 Enregistrer</button>
        </div>
      </div>
    </div>`;
  }
};

// ═══════════════════════════════════════════════════════════
// CHANTIERS
// ═══════════════════════════════════════════════════════════
const CHANTIERS = {
  STATES: [
    { id:'devis', label:'Devis', color:'#f59e0b' },
    { id:'signe', label:'Signé', color:'#3b82f6' },
    { id:'en_commande', label:'En commande', color:'#8b5cf6' },
    { id:'en_cours', label:'En cours', color:'#0ea5e9' },
    { id:'facture', label:'Facturé', color:'#10b981' },
    { id:'sav', label:'SAV', color:'#ef4444' },
  ],

  render() {
    const chantiers = DB.getAll('chantiers');
    const totalDevis = chantiers.filter(c=>c.state==='devis').reduce((s,c)=>s+(c.amount_ht||0),0);
    const totalEnCours = chantiers.filter(c=>c.state==='en_cours').reduce((s,c)=>s+(c.amount_ht||0),0);
    const totalFacture = chantiers.filter(c=>c.state==='facture').reduce((s,c)=>s+(c.amount_ht||0),0);

    const el = document.getElementById('page-chantiers');
    el.innerHTML = `
    <div class="page-header">
      <div>
        <div class="page-title">Chantiers</div>
        <div class="page-subtitle">${chantiers.length} chantiers</div>
      </div>
      <div style="display:flex;gap:8px">
        <button class="btn btn-ghost" id="btn-view-list" onclick="CHANTIERS.setView('list')">☰ Liste</button>
        <button class="btn btn-primary" id="btn-view-pipeline" onclick="CHANTIERS.setView('pipeline')">📋 Pipeline</button>
        <button class="btn btn-primary" onclick="CHANTIERS.openNew()">+ Nouveau chantier</button>
      </div>
    </div>
    <div class="kpi-grid" style="margin-bottom:20px">
      <div class="kpi-card"><div class="kpi-icon">📝</div><div class="kpi-label">En devis</div><div class="kpi-value" style="color:var(--warning)">${U.fmtEur(totalDevis)}</div></div>
      <div class="kpi-card"><div class="kpi-icon">🔨</div><div class="kpi-label">En cours</div><div class="kpi-value" style="color:var(--accent)">${U.fmtEur(totalEnCours)}</div></div>
      <div class="kpi-card"><div class="kpi-icon">✅</div><div class="kpi-label">Facturé</div><div class="kpi-value" style="color:var(--success)">${U.fmtEur(totalFacture)}</div></div>
    </div>
    <div id="chantiers-view"></div>
    ${this.modalHtml()}`;
    this.setView('pipeline');
  },

  setView(v) {
    this._view = v;
    if (v === 'pipeline') this.renderPipeline();
    else this.renderList();
  },

  renderPipeline() {
    const chantiers = DB.getAll('chantiers');
    document.getElementById('chantiers-view').innerHTML = `
    <div class="pipeline">
      ${this.STATES.map(s => {
        const cards = chantiers.filter(c => c.state === s.id);
        return `<div class="pipeline-col">
          <div class="pipeline-col-header" style="background:${s.color}20;color:${s.color};border:1px solid ${s.color}30">
            ${s.label} (${cards.length})
          </div>
          <div class="pipeline-cards" style="margin-top:8px">
            ${cards.map(c => {
              const client = DB.getById('clients', c.client_id);
              return `<div class="pipeline-card" onclick="CHANTIERS.openEdit('${c.id}')">
                <div class="pipeline-card-title">${c.name}</div>
                <div class="pipeline-card-client">👤 ${client?.name||'—'}</div>
                <div style="font-size:11px;color:var(--text-muted);margin-top:4px">📅 ${U.fmtDate(c.date_end_planned)}</div>
                <div class="pipeline-card-amount">${U.fmtEur(c.amount_ht)}</div>
              </div>`;
            }).join('') || `<div style="padding:20px;text-align:center;color:var(--text-muted);font-size:12px;border:2px dashed var(--border);border-radius:8px">Aucun</div>`}
          </div>
        </div>`;
      }).join('')}
    </div>`;
  },

  renderList() {
    const chantiers = DB.getAll('chantiers');
    document.getElementById('chantiers-view').innerHTML = `
    <div class="card">
      <div class="table-wrap">
        <table>
          <thead><tr><th>Chantier</th><th>Client</th><th>Type</th><th>Commercial</th><th>Montant HT</th><th>Fin prévue</th><th>État</th><th></th></tr></thead>
          <tbody>
            ${chantiers.map(c => {
              const client = DB.getById('clients', c.client_id);
              const comm = DB.getById('users', c.commercial_id);
              return `<tr>
                <td><strong>${c.name}</strong></td>
                <td>${client?.name||'—'}</td>
                <td>${c.type==='construction'?'🏗️':'🔧'} ${c.type}</td>
                <td>${comm?.name||'—'}</td>
                <td><strong>${U.fmtEur(c.amount_ht)}</strong></td>
                <td>${U.fmtDate(c.date_end_planned)}</td>
                <td>${U.stateBadge(c.state)}</td>
                <td><button class="btn btn-ghost btn-sm" onclick="CHANTIERS.openEdit('${c.id}')">✏️</button></td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>`;
  },

  openNew() {
    document.getElementById('modal-chantier').classList.add('open');
    document.getElementById('modal-chantier-title').textContent = 'Nouveau chantier';
    document.getElementById('form-chantier').reset();
    document.getElementById('fch-id').value = '';
    document.getElementById('fch-date-start').value = U.today();
  },

  openEdit(id) {
    const c = DB.getById('chantiers', id);
    if (!c) return;
    document.getElementById('modal-chantier').classList.add('open');
    document.getElementById('modal-chantier-title').textContent = c.name;
    document.getElementById('fch-id').value = c.id;
    document.getElementById('fch-name').value = c.name||'';
    document.getElementById('fch-client').value = c.client_id||'';
    document.getElementById('fch-type').value = c.type||'construction';
    document.getElementById('fch-state').value = c.state||'devis';
    document.getElementById('fch-amount').value = c.amount_ht||'';
    document.getElementById('fch-date-start').value = c.date_start||'';
    document.getElementById('fch-date-end').value = c.date_end_planned||'';
    document.getElementById('fch-commercial').value = c.commercial_id||'';
    document.getElementById('fch-desc').value = c.description||'';
    document.getElementById('fch-odoo').value = c.odoo_ref||'';
  },

  save() {
    const id = document.getElementById('fch-id').value || DB.genId();
    const chantier = {
      id,
      name: document.getElementById('fch-name').value,
      client_id: document.getElementById('fch-client').value,
      type: document.getElementById('fch-type').value,
      state: document.getElementById('fch-state').value,
      amount_ht: parseFloat(document.getElementById('fch-amount').value)||0,
      date_start: document.getElementById('fch-date-start').value,
      date_end_planned: document.getElementById('fch-date-end').value,
      commercial_id: document.getElementById('fch-commercial').value,
      description: document.getElementById('fch-desc').value,
      odoo_ref: document.getElementById('fch-odoo').value,
      created_at: U.today(),
    };
    DB.save('chantiers', chantier);
    U.closeModal('modal-chantier');
    CHANTIERS.render();
    U.toast('Chantier enregistré', 'success');
  },

  modalHtml() {
    const clients = DB.getAll('clients');
    const commerciaux = DB.getAll('users').filter(u => ['patron','commercial','admin'].includes(u.role));
    return `
    <div class="modal-overlay" id="modal-chantier">
      <div class="modal-box modal-lg">
        <div class="modal-header">
          <div class="modal-title" id="modal-chantier-title">Chantier</div>
          <button class="modal-close" onclick="U.closeModal('modal-chantier')">×</button>
        </div>
        <form id="form-chantier" class="modal-body" onsubmit="event.preventDefault();CHANTIERS.save()">
          <input type="hidden" id="fch-id">
          <div class="form-group"><label class="form-label">Nom du chantier *</label><input class="form-control" id="fch-name" required></div>
          <div class="form-row">
            <div class="form-group"><label class="form-label">Client *</label>
              <select class="form-control" id="fch-client" required>
                <option value="">— Sélectionner —</option>
                ${clients.map(c=>`<option value="${c.id}">${c.name}</option>`).join('')}
              </select>
            </div>
            <div class="form-group"><label class="form-label">Commercial</label>
              <select class="form-control" id="fch-commercial">
                <option value="">—</option>
                ${commerciaux.map(u=>`<option value="${u.id}">${u.name}</option>`).join('')}
              </select>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group"><label class="form-label">Type</label>
              <select class="form-control" id="fch-type">
                <option value="construction">🏗️ Construction</option>
                <option value="renovation">🔨 Rénovation</option>
                <option value="entretien">🔧 Entretien</option>
                <option value="sav">🚨 SAV</option>
              </select>
            </div>
            <div class="form-group"><label class="form-label">État</label>
              <select class="form-control" id="fch-state">
                ${this.STATES.map(s=>`<option value="${s.id}">${s.label}</option>`).join('')}
              </select>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group"><label class="form-label">Montant HT (€)</label><input class="form-control" id="fch-amount" type="number" step=".01"></div>
            <div class="form-group"><label class="form-label">Réf. Odoo</label><input class="form-control" id="fch-odoo" placeholder="N° facture Odoo"></div>
          </div>
          <div class="form-row">
            <div class="form-group"><label class="form-label">Date début</label><input class="form-control" id="fch-date-start" type="date"></div>
            <div class="form-group"><label class="form-label">Date fin prévue</label><input class="form-control" id="fch-date-end" type="date"></div>
          </div>
          <div class="form-group"><label class="form-label">Description</label><textarea class="form-control" id="fch-desc" rows="3"></textarea></div>
        </form>
        <div class="modal-footer">
          <button class="btn btn-ghost" onclick="U.closeModal('modal-chantier')">Annuler</button>
          <button class="btn btn-primary" onclick="CHANTIERS.save()">💾 Enregistrer</button>
        </div>
      </div>
    </div>`;
  }
};

window.FICHES = FICHES;
window.CHANTIERS = CHANTIERS;
