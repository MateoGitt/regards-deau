// ═══════════════════════════════════════════════════════════
// DASHBOARD
// ═══════════════════════════════════════════════════════════
const DASH = {
  render() {
    const fiches = DB.getAll('fiches');
    const chantiers = DB.getAll('chantiers');
    const clients = DB.getAll('clients');
    const products = DB.getAll('products');
    const planning = DB.getAll('planning');
    const today = U.today();

    const fichesToday = planning.filter(p => p.date === today).length;
    const chantierEnCours = chantiers.filter(c => c.state === 'en_cours').length;
    const stockAlertes = products.filter(p => p.qty <= p.qty_min).length;
    const caMonth = chantiers.filter(c => c.state === 'facture').reduce((s,c) => s + (c.amount_ht||0), 0);

    const el = document.getElementById('page-dashboard');
    el.innerHTML = `
    <div class="page-header">
      <div>
        <div class="page-title">Tableau de bord</div>
        <div class="page-subtitle">${new Date().toLocaleDateString('fr-BE',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}</div>
      </div>
    </div>
    <div class="kpi-grid">
      <div class="kpi-card">
        <div class="kpi-icon"></div>
        <div class="kpi-label">Interventions aujourd'hui</div>
        <div class="kpi-value" style="color:var(--accent)">${fichesToday}</div>
        <div class="kpi-sub">planifiées</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-icon"></div>
        <div class="kpi-label">Chantiers en cours</div>
        <div class="kpi-value" style="color:var(--info)">${chantierEnCours}</div>
        <div class="kpi-sub">sur ${chantiers.length} total</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-icon"></div>
        <div class="kpi-label">Clients</div>
        <div class="kpi-value" style="color:var(--success)">${clients.length}</div>
        <div class="kpi-sub">dans la base</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-icon"></div>
        <div class="kpi-label">Alertes stock</div>
        <div class="kpi-value" style="color:${stockAlertes>0?'var(--danger)':'var(--success)'}">${stockAlertes}</div>
        <div class="kpi-sub">produits sous le seuil</div>
      </div>
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:20px;">
      <div class="card">
        <div class="card-header"><div class="card-title"> Planning du jour</div></div>
        <div class="card-body" style="padding:0">
          ${planning.filter(p=>p.date===today).length ? planning.filter(p=>p.date===today).map(p => {
            const client = DB.getById('clients', p.client_id);
            const techs = DB.getAll('users').filter(u => (p.technician_ids||[]).includes(u.id));
            return `<div style="padding:12px 16px;border-bottom:1px solid var(--border);display:flex;align-items:center;gap:12px;">
              <div style="width:4px;height:40px;background:${p.color||'var(--accent)'};border-radius:2px;"></div>
              <div style="flex:1">
                <div style="font-weight:600;font-size:13px">${p.title}</div>
                <div style="font-size:12px;color:var(--text-muted)">${client?.name||'—'} · ${U.fmtTime(p.time_start||0)}–${U.fmtTime(p.time_end||0)}</div>
              </div>
              <div style="display:flex;gap:4px">${techs.map(t=>`<div class="user-avatar" style="background:${t.color};width:28px;height:28px;font-size:11px">${U.initials(t.name)}</div>`).join('')}</div>
            </div>`;
          }).join('') : '<div style="padding:20px;text-align:center;color:var(--text-muted)">Aucune intervention aujourd\'hui</div>'}
        </div>
      </div>

      <div class="card">
        <div class="card-header"><div class="card-title">⚠️ Alertes stock</div></div>
        <div class="card-body" style="padding:0">
          ${products.filter(p=>p.qty<=p.qty_min).slice(0,6).map(p=>`
            <div style="padding:10px 16px;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:center">
              <div>
                <div style="font-weight:600;font-size:13px">${p.name}</div>
                <div style="font-size:11px;color:var(--text-muted)">${p.sku}</div>
              </div>
              <div style="text-align:right">
                <div style="font-weight:700;color:${p.qty===0?'var(--danger)':'var(--warning)'}">${p.qty} ${p.unit}</div>
                <div style="font-size:11px;color:var(--text-muted)">min: ${p.qty_min}</div>
              </div>
            </div>`).join('') || '<div style="padding:20px;text-align:center;color:var(--text-muted)">Aucune alerte 👍</div>'}
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-header"><div class="card-title"> Chantiers actifs</div></div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Chantier</th><th>Client</th><th>Type</th><th>État</th><th>Montant HT</th><th>Date prévue</th></tr></thead>
          <tbody>
            ${chantiers.filter(c=>c.state!=='facture').map(c => {
              const client = DB.getById('clients', c.client_id);
              return `<tr style="cursor:pointer" onclick="APP.goPage('chantiers')">
                <td><strong>${c.name}</strong></td>
                <td>${client?.name||'—'}</td>
                <td>${c.type==='construction'?' Construction':' SAV'}</td>
                <td>${U.stateBadge(c.state)}</td>
                <td><strong>${U.fmtEur(c.amount_ht)}</strong></td>
                <td>${U.fmtDate(c.date_end_planned)}</td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>`;
  }
};

// ═══════════════════════════════════════════════════════════
// PLANNING
// ═══════════════════════════════════════════════════════════
const PLANNING = {
  currentWeekOffset: 0,

  render() {
    const user = AUTH.getUser();
    const el = document.getElementById('page-planning');
    const isTech = user.role === 'technicien';

    el.innerHTML = `
    <div class="page-header">
      <div>
        <div class="page-title">Planning</div>
        <div class="page-subtitle">${isTech ? 'Ma journée' : 'Vue semaine équipe'}</div>
      </div>
      <div style="display:flex;gap:8px">
        ${AUTH.isAtLeast('patron') ? `<button class="btn btn-primary" onclick="PLANNING.openNew()">Nouvelle tâche</button>` : ''}
        ${!isTech ? `
        <button class="btn btn-ghost btn-icon" onclick="PLANNING.changeWeek(-1)">◀</button>
        <button class="btn btn-ghost" onclick="PLANNING.changeWeek(0)">Aujourd'hui</button>
        <button class="btn btn-ghost btn-icon" onclick="PLANNING.changeWeek(1)">▶</button>` : ''}
      </div>
    </div>
    <div id="planning-content"></div>
    ${this.modalHtml()}`;

    if (isTech) this.renderTechView(user);
    else this.renderWeekView();
  },

  getWeekDates(offset = 0) {
    const today = new Date();
    const monday = new Date(today);
    monday.setDate(today.getDate() - today.getDay() + 1 + offset * 7);
    return Array.from({length: 6}, (_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      return d;
    });
  },

  changeWeek(dir) {
    if (dir === 0) this.currentWeekOffset = 0;
    else this.currentWeekOffset += dir;
    this.renderWeekView();
  },

  renderWeekView() {
    const users = DB.getAll('users').filter(u => u.role === 'technicien' && u.active);
    const planning = DB.getAll('planning');
    const dates = this.getWeekDates(this.currentWeekOffset);
    const DAY_NAMES = ['Lun','Mar','Mer','Jeu','Ven','Sam'];

    let html = `<div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;background:var(--bg-card);border-radius:var(--radius);overflow:hidden;border:1px solid var(--border)">
      <thead><tr>
        <th style="padding:10px 14px;background:var(--primary);color:#fff;width:130px;font-size:12px">Technicien</th>
        ${dates.map((d,i) => {
          const isToday = d.toISOString().split('T')[0] === U.today();
          return `<th style="padding:10px;background:${isToday?'var(--accent)':'var(--primary)'};color:#fff;font-size:12px;font-weight:700;text-align:center;border-left:1px solid rgba(255,255,255,.1)">
            ${DAY_NAMES[i]}<br><span style="font-size:16px;font-weight:800">${d.getDate()}</span>
          </th>`;
        }).join('')}
      </tr></thead>
      <tbody>`;

    users.forEach(tech => {
      html += `<tr>
        <td style="padding:10px 14px;border-bottom:1px solid var(--border);font-weight:600;font-size:13px;background:var(--bg)">
          <div style="display:flex;align-items:center;gap:8px">
            <div class="user-avatar" style="background:${tech.color};width:28px;height:28px;font-size:11px">${U.initials(tech.name)}</div>
            ${tech.name.split(' ')[0]}
          </div>
        </td>`;
      dates.forEach(d => {
        const dateStr = d.toISOString().split('T')[0];
        const events = planning.filter(p => p.date === dateStr && (p.technician_ids||[]).includes(tech.id));
        const isToday = dateStr === U.today();
        html += `<td style="padding:6px;border-bottom:1px solid var(--border);border-left:1px solid var(--border);vertical-align:top;min-height:60px;background:${isToday?'rgba(14,165,233,.04)':''}">
          ${events.map(ev => {
            const client = DB.getById('clients', ev.client_id);
            return `<div class="planning-event" style="background:${ev.color||'var(--accent)'}" onclick="PLANNING.openEdit('${ev.id}')" title="${ev.title}">
              ${U.fmtTime(ev.time_start||0)} ${ev.title}
            </div>`;
          }).join('')}
          ${AUTH.isAtLeast('patron') ? `<div style="opacity:0;text-align:center;font-size:18px;cursor:pointer;transition:.15s" onmouseover="this.style.opacity=1" onmouseout="this.style.opacity=0" onclick="PLANNING.openNew('${tech.id}','${dateStr}')">+</div>` : ''}
        </td>`;
      });
      html += '</tr>';
    });

    html += '</tbody></table></div>';
    document.getElementById('planning-content').innerHTML = html;
  },

  renderTechView(user) {
    const today = U.today();
    const planning = DB.getAll('planning').filter(p => p.date === today && (p.technician_ids||[]).includes(user.id));
    const el = document.getElementById('planning-content');

    if (!planning.length) {
      el.innerHTML = `<div class="card"><div class="card-body" style="text-align:center;padding:40px">
        <div style="font-size:48px"></div>
        <div style="font-size:18px;font-weight:700;margin-top:12px">Aucune tâche aujourd'hui</div>
        <div style="color:var(--text-muted);margin-top:6px">Bonne journée !</div>
      </div></div>`;
      return;
    }

    el.innerHTML = planning.map(ev => {
      const client = DB.getById('clients', ev.client_id);
      const chantier = DB.getById('chantiers', ev.chantier_id);
      return `<div class="card" style="margin-bottom:16px">
        <div style="height:4px;background:${ev.color||'var(--accent)'}"></div>
        <div class="card-body">
          <div style="display:flex;justify-content:space-between;align-items:flex-start">
            <div>
              <div style="font-size:18px;font-weight:800">${ev.title}</div>
              <div style="font-size:14px;color:var(--text-muted);margin-top:4px"> ${client?.name||'—'}</div>
              ${client?.street?`<div style="font-size:13px;color:var(--text-muted)"> ${client.street}, ${client.city}</div>`:''}
            </div>
            <div style="text-align:right">
              <div style="font-size:20px;font-weight:800;color:var(--accent)">${U.fmtTime(ev.time_start||0)}</div>
              <div style="font-size:13px;color:var(--text-muted)">→ ${U.fmtTime(ev.time_end||0)}</div>
            </div>
          </div>
          ${ev.materials?.length?`<div style="margin-top:12px;padding:10px;background:var(--bg);border-radius:8px">
            <div style="font-size:11px;font-weight:700;text-transform:uppercase;color:var(--text-muted);margin-bottom:6px">Matériaux à emporter</div>
            ${ev.materials.map(m=>`<div style="font-size:13px">• ${m}</div>`).join('')}
          </div>`:''}
          ${ev.notes?`<div style="margin-top:10px;font-size:13px;color:var(--text-muted)">📝 ${ev.notes}</div>`:''}
          <div style="margin-top:14px;display:flex;gap:8px">
            <button class="btn btn-primary" onclick="FICHES.openNew('${client?.id||''}')">Créer une fiche</button>
            ${client?.phone?`<a href="tel:${client.phone}" class="btn btn-ghost"> Appeler</a>`:''}
          </div>
        </div>
      </div>`;
    }).join('');
  },

  openNew(techId = '', date = '') {
    const users = DB.getAll('users').filter(u => u.role === 'technicien' && u.active);
    const clients = DB.getAll('clients');
    document.getElementById('modal-planning').classList.add('open');
    document.getElementById('modal-planning-title').textContent = 'Nouvelle tâche';
    document.getElementById('form-planning').reset();
    document.getElementById('fp-id').value = '';
    document.getElementById('fp-date').value = date || U.today();
    document.getElementById('fp-techs').innerHTML = users.map(u =>
      `<label style="display:flex;align-items:center;gap:8px;padding:6px 0"><input type="checkbox" value="${u.id}" ${u.id===techId?'checked':''}> <div class="user-avatar" style="background:${u.color};width:24px;height:24px;font-size:10px">${U.initials(u.name)}</div> ${u.name}</label>`
    ).join('');
  },

  openEdit(id) {
    const ev = DB.getById('planning', id);
    if (!ev) return;
    const users = DB.getAll('users').filter(u => u.role === 'technicien' && u.active);
    document.getElementById('modal-planning').classList.add('open');
    document.getElementById('modal-planning-title').textContent = 'Modifier la tâche';
    document.getElementById('fp-id').value = ev.id;
    document.getElementById('fp-title').value = ev.title;
    document.getElementById('fp-date').value = ev.date;
    document.getElementById('fp-start').value = ev.time_start;
    document.getElementById('fp-end').value = ev.time_end;
    document.getElementById('fp-notes').value = ev.notes || '';
    document.getElementById('fp-materials').value = (ev.materials||[]).join('\n');
    document.getElementById('fp-client').value = ev.client_id || '';
    document.getElementById('fp-techs').innerHTML = users.map(u =>
      `<label style="display:flex;align-items:center;gap:8px;padding:6px 0"><input type="checkbox" value="${u.id}" ${(ev.technician_ids||[]).includes(u.id)?'checked':''}> <div class="user-avatar" style="background:${u.color};width:24px;height:24px;font-size:10px">${U.initials(u.name)}</div> ${u.name}</label>`
    ).join('');
    if (AUTH.isAtLeast('patron')) {
      document.getElementById('btn-delete-planning').style.display = 'inline-flex';
      document.getElementById('btn-delete-planning').onclick = () => {
        if (confirm('Supprimer cette tâche ?')) { DB.remove('planning', id); U.closeModal('modal-planning'); PLANNING.renderWeekView(); }
      };
    }
  },

  save() {
    const id = document.getElementById('fp-id').value || DB.genId();
    const techs = [...document.querySelectorAll('#fp-techs input:checked')].map(i => i.value);
    const mats = document.getElementById('fp-materials').value.split('\n').filter(Boolean);
    const ev = {
      id,
      title: document.getElementById('fp-title').value,
      date: document.getElementById('fp-date').value,
      time_start: parseFloat(document.getElementById('fp-start').value)||0,
      time_end: parseFloat(document.getElementById('fp-end').value)||0,
      notes: document.getElementById('fp-notes').value,
      materials: mats,
      client_id: document.getElementById('fp-client').value,
      technician_ids: techs,
      color: 'var(--accent)',
    };
    DB.save('planning', ev);
    U.closeModal('modal-planning');
    PLANNING.render();
    U.toast('Tâche enregistrée', 'success');
  },

  modalHtml() {
    const clients = DB.getAll('clients');
    return `
    <div class="modal-overlay" id="modal-planning">
      <div class="modal-box">
        <div class="modal-header">
          <div class="modal-title" id="modal-planning-title">Tâche planning</div>
          <button class="modal-close" onclick="U.closeModal('modal-planning')">×</button>
        </div>
        <form id="form-planning" class="modal-body" onsubmit="event.preventDefault();PLANNING.save()">
          <input type="hidden" id="fp-id">
          <div class="form-group">
            <label class="form-label">Titre *</label>
            <input class="form-control" id="fp-title" required placeholder="Ex: Hivernage Martin">
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Date *</label>
              <input class="form-control" id="fp-date" type="date" required>
            </div>
            <div class="form-group">
              <label class="form-label">Client</label>
              <select class="form-control" id="fp-client">
                <option value="">— Aucun client —</option>
                ${clients.map(c=>`<option value="${c.id}">${c.name}</option>`).join('')}
              </select>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Heure début</label>
              <input class="form-control" id="fp-start" type="number" step=".5" min="0" max="24" placeholder="8">
            </div>
            <div class="form-group">
              <label class="form-label">Heure fin</label>
              <input class="form-control" id="fp-end" type="number" step=".5" min="0" max="24" placeholder="17">
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Techniciens</label>
            <div id="fp-techs"></div>
          </div>
          <div class="form-group">
            <label class="form-label">Matériaux à emporter (1 par ligne)</label>
            <textarea class="form-control" id="fp-materials" rows="3" placeholder="Chlore 5kg&#10;Filtre sable&#10;..."></textarea>
          </div>
          <div class="form-group">
            <label class="form-label">Notes</label>
            <textarea class="form-control" id="fp-notes" rows="2"></textarea>
          </div>
        </form>
        <div class="modal-footer">
          <button class="btn btn-danger btn-sm" id="btn-delete-planning" style="display:none;margin-right:auto">🗑️ Supprimer</button>
          <button class="btn btn-ghost" onclick="U.closeModal('modal-planning')">Annuler</button>
          <button class="btn btn-primary" onclick="PLANNING.save()">💾 Enregistrer</button>
        </div>
      </div>
    </div>`;
  }
};

// ═══════════════════════════════════════════════════════════
// CLIENTS
// ═══════════════════════════════════════════════════════════
const CLIENTS = {
  filter: '',

  render() {
    const el = document.getElementById('page-clients');
    el.innerHTML = `
    <div class="page-header">
      <div>
        <div class="page-title">Clients</div>
        <div class="page-subtitle">${DB.getAll('clients').length} clients enregistrés</div>
      </div>
      <div style="display:flex;gap:8px">
        <input class="form-control" id="client-search" placeholder="🔍 Rechercher..." style="width:220px" oninput="CLIENTS.filter=this.value;CLIENTS.renderList()">
        <select class="form-control" id="client-filter-type" style="width:150px" onchange="CLIENTS.renderList()">
          <option value="">Tous les types</option>
          <option value="piscine">Piscine</option>
          <option value="spa"> Spa</option>
          <option value="hammam"> Hammam</option>
          <option value="sauna"> Sauna</option>
        </select>
        <button class="btn btn-primary" onclick="CLIENTS.openNew()">Nouveau client</button>
      </div>
    </div>
    <div id="clients-list"></div>
    ${this.modalHtml()}`;
    this.renderList();
  },

  renderList() {
    const search = (document.getElementById('client-search')?.value||'').toLowerCase();
    const typeFilter = document.getElementById('client-filter-type')?.value||'';
    let clients = DB.getAll('clients');
    if (search) clients = clients.filter(c => `${c.name} ${c.city} ${c.phone}`.toLowerCase().includes(search));
    if (typeFilter) clients = clients.filter(c => c.equipment_type === typeFilter);

    document.getElementById('clients-list').innerHTML = `
    <div class="card">
      <div class="table-wrap">
        <table>
          <thead><tr><th>Client</th><th>Équipement</th><th>Localité</th><th>Contact</th><th>Technicien</th><th>Fiches</th><th></th></tr></thead>
          <tbody>
            ${clients.map(c => {
              const fiches = DB.getAll('fiches').filter(f => f.client_id === c.id);
              return `<tr>
                <td><strong>${c.name}</strong></td>
                <td>${U.EQUIP_LABELS[c.equipment_type]||c.equipment_type}</td>
                <td>${c.city||'—'}</td>
                <td>${c.phone||'—'}</td>
                <td>${c.pump_model||'—'}</td>
                <td><span class="badge" style="background:var(--accent)20;color:var(--accent)">${fiches.length}</span></td>
                <td>
                  <button class="btn btn-ghost btn-sm" onclick="CLIENTS.openEdit('${c.id}')">✏️</button>
                  <button class="btn btn-primary btn-sm" onclick="FICHES.openNew('${c.id}')">Fiche</button>
                </td>
              </tr>`;
            }).join('') || '<tr><td colspan="7" style="text-align:center;padding:30px;color:var(--text-muted)">Aucun client trouvé</td></tr>'}
          </tbody>
        </table>
      </div>
    </div>`;
  },

  openNew() {
    document.getElementById('modal-client').classList.add('open');
    document.getElementById('modal-client-title').textContent = 'Nouveau client';
    document.getElementById('form-client').reset();
    document.getElementById('fc-id').value = '';
  },

  openEdit(id) {
    const c = DB.getById('clients', id);
    if (!c) return;
    document.getElementById('modal-client').classList.add('open');
    document.getElementById('modal-client-title').textContent = 'Modifier client';
    document.getElementById('fc-id').value = c.id;
    document.getElementById('fc-name').value = c.name||'';
    document.getElementById('fc-phone').value = c.phone||'';
    document.getElementById('fc-email').value = c.email||'';
    document.getElementById('fc-street').value = c.street||'';
    document.getElementById('fc-zip').value = c.zip||'';
    document.getElementById('fc-city').value = c.city||'';
    document.getElementById('fc-equip').value = c.equipment_type||'piscine';
    document.getElementById('fc-basin').value = c.basin_type||'';
    document.getElementById('fc-volume').value = c.basin_volume||'';
    document.getElementById('fc-pump').value = c.pump_model||'';
    document.getElementById('fc-treatment').value = c.water_treatment||'';
    document.getElementById('fc-other').value = c.other_equipment||'';
    document.getElementById('fc-notes').value = c.technical_notes||'';
  },

  save() {
    const id = document.getElementById('fc-id').value || DB.genId();
    const client = {
      id,
      name: document.getElementById('fc-name').value,
      phone: document.getElementById('fc-phone').value,
      email: document.getElementById('fc-email').value,
      street: document.getElementById('fc-street').value,
      zip: document.getElementById('fc-zip').value,
      city: document.getElementById('fc-city').value,
      equipment_type: document.getElementById('fc-equip').value,
      basin_type: document.getElementById('fc-basin').value,
      basin_volume: parseFloat(document.getElementById('fc-volume').value)||null,
      pump_model: document.getElementById('fc-pump').value,
      water_treatment: document.getElementById('fc-treatment').value,
      other_equipment: document.getElementById('fc-other').value,
      technical_notes: document.getElementById('fc-notes').value,
      created_at: U.today(),
    };
    DB.save('clients', client);
    U.closeModal('modal-client');
    CLIENTS.render();
    U.toast('Client enregistré', 'success');
  },

  modalHtml() {
    return `
    <div class="modal-overlay" id="modal-client">
      <div class="modal-box modal-lg">
        <div class="modal-header">
          <div class="modal-title" id="modal-client-title">Client</div>
          <button class="modal-close" onclick="U.closeModal('modal-client')">×</button>
        </div>
        <form id="form-client" class="modal-body" onsubmit="event.preventDefault();CLIENTS.save()">
          <input type="hidden" id="fc-id">
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px">
            <div>
              <div style="font-weight:700;margin-bottom:12px;color:var(--text-muted);font-size:12px;text-transform:uppercase">Coordonnées</div>
              <div class="form-group"><label class="form-label">Nom complet *</label><input class="form-control" id="fc-name" required></div>
              <div class="form-group"><label class="form-label">Téléphone</label><input class="form-control" id="fc-phone"></div>
              <div class="form-group"><label class="form-label">Email</label><input class="form-control" id="fc-email" type="email"></div>
              <div class="form-group"><label class="form-label">Adresse</label><input class="form-control" id="fc-street"></div>
              <div class="form-row">
                <div class="form-group"><label class="form-label">Code postal</label><input class="form-control" id="fc-zip"></div>
                <div class="form-group"><label class="form-label">Ville</label><input class="form-control" id="fc-city"></div>
              </div>
            </div>
            <div>
              <div style="font-weight:700;margin-bottom:12px;color:var(--text-muted);font-size:12px;text-transform:uppercase">Équipement</div>
              <div class="form-group"><label class="form-label">Type équipement</label>
                <select class="form-control" id="fc-equip">
                  <option value="piscine">Piscine</option>
                  <option value="spa"> Spa / Jacuzzi</option>
                  <option value="hammam"> Hammam</option>
                  <option value="sauna"> Sauna</option>
                  <option value="multi"> Multi-équipements</option>
                </select>
              </div>
              <div class="form-group"><label class="form-label">Type bassin</label>
                <select class="form-control" id="fc-basin">
                  <option value="">—</option>
                  <option value="beton">Béton / Carrelage</option>
                  <option value="coque">Coque polyester</option>
                  <option value="liner">Liner</option>
                  <option value="hors_sol">Hors-sol</option>
                </select>
              </div>
              <div class="form-group"><label class="form-label">Volume (m³)</label><input class="form-control" id="fc-volume" type="number" step=".1"></div>
              <div class="form-group"><label class="form-label">Pompe / Filtration</label><input class="form-control" id="fc-pump" placeholder="Ex: Hayward 1.5cv"></div>
              <div class="form-group"><label class="form-label">Traitement eau</label>
                <select class="form-control" id="fc-treatment">
                  <option value="">—</option>
                  <option value="chlore">Chlore</option>
                  <option value="brome">Brome</option>
                  <option value="sel">Sel / Électrolyseur</option>
                  <option value="uv">UV</option>
                  <option value="biguanide">Biguanide</option>
                </select>
              </div>
              <div class="form-group"><label class="form-label">Autres équipements</label><input class="form-control" id="fc-other" placeholder="Robot, volet, PAC..."></div>
            </div>
          </div>
          <div class="form-group" style="margin-top:8px"><label class="form-label">Notes techniques</label>
            <textarea class="form-control" id="fc-notes" rows="3" placeholder="Accès, particularités, historique..."></textarea>
          </div>
        </form>
        <div class="modal-footer">
          <button class="btn btn-ghost" onclick="U.closeModal('modal-client')">Annuler</button>
          <button class="btn btn-primary" onclick="CLIENTS.save()">💾 Enregistrer</button>
        </div>
      </div>
    </div>`;
  }
};

window.DASH = DASH;
window.PLANNING = PLANNING;
window.CLIENTS = CLIENTS;
