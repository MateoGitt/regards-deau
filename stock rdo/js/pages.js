/* ============================================================
   pages.js — Rendu de toutes les pages
   ============================================================ */

/* ══════════════════════════════════════════════════════════
   DASHBOARD
   ══════════════════════════════════════════════════════════ */
function renderDash() {
  var ddate = document.getElementById('ddate');
  if (ddate) ddate.textContent = new Date().toLocaleDateString('fr-FR', { weekday:'long', day:'numeric', month:'long', year:'numeric' });

  rBB('bbanner');

  var tot   = prods.length;
  var low   = prods.filter(function(p) { return st(p) === 'low'; }).length;
  var out   = prods.filter(function(p) { return st(p) === 'out'; }).length;
  var mvts7 = mvts.filter(function(m) { return Date.now() - new Date(m.date).getTime() <= 7 * 86400000; }).length;

  var met = document.getElementById('metrics');
  if (met) met.innerHTML =
    mc('References', tot, cats.length + ' categories') +
    mc('Stock bas', low, 'sous le seuil alerte', 'am') +
    mc('Ruptures', out, 'produit(s) a zero', out > 0 ? 're' : '') +
    mc('Mouvements (7j)', mvts7, mvts.length + ' au total');

  // A réapprovisionner
  var dr = document.getElementById('drestock');
  if (dr) {
    var reap = prods.filter(function(p) { return st(p) === 'out' || st(p) === 'low'; }).slice(0, 8);
    dr.innerHTML = reap.length
      ? reap.map(function(p) {
          return '<div style="display:flex;justify-content:space-between;align-items:center;padding:10px 16px;border-bottom:1px solid var(--bor)">' +
            '<div><div style="font-size:13px;font-weight:600">' + p.name + '</div>' +
            '<div style="font-size:11px;color:var(--mut)">' + p.sku + (p.sups&&p.sups.length?' · '+p.sups[0]:'') + '</div></div>' +
            stBadge(p) + '</div>';
        }).join('')
      : '<div style="text-align:center;padding:24px;color:var(--hint);font-size:13px">Aucune alerte — Stock OK</div>';
  }

  // Derniers mouvements
  var dm = document.getElementById('dmvt');
  if (dm) {
    var lm = mvts.slice(-6).reverse();
    dm.innerHTML = lm.length
      ? lm.map(function(m) {
          var col  = m.type === 'in' ? 'var(--gr)' : m.type === 'out' ? 'var(--re)' : 'var(--am)';
          var sign = m.type === 'in' ? '+' : m.type === 'out' ? '-' : '~';
          return '<div style="display:flex;justify-content:space-between;align-items:center;padding:10px 16px;border-bottom:1px solid var(--bor)">' +
            '<div><div style="font-size:13px;font-weight:600">' + m.pname + '</div>' +
            '<div style="font-size:11px;color:var(--mut)">' + fds(m.date) + (m.dest ? ' · ' + m.dest : '') + '</div></div>' +
            '<span style="font-weight:700;color:' + col + '">' + sign + m.qty + '</span></div>';
        }).join('')
      : '<div style="text-align:center;padding:24px;color:var(--hint);font-size:13px">Aucun mouvement</div>';
  }

  // Stock par catégorie
  var dc = document.getElementById('dash-cats');
  if (dc) {
    var catData = cats.map(function(c) {
      var ps = prods.filter(function(p) { return p.cid === c.id; });
      return { name: c.name, color: c.color, count: ps.length, qty: ps.reduce(function(a,p) { return a+p.qty; }, 0) };
    }).filter(function(c) { return c.count > 0; }).sort(function(a,b) { return b.qty - a.qty; });
    var maxQty = catData.reduce(function(m,c) { return Math.max(m, c.qty); }, 1);
    dc.innerHTML = catData.map(function(c) {
      var pct = Math.round(c.qty / maxQty * 100);
      return '<div style="margin-bottom:12px">' +
        '<div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:4px">' +
        '<span><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:' + c.color + ';margin-right:6px"></span>' + c.name + '</span>' +
        '<span style="font-weight:700">' + c.qty + ' u. (' + c.count + ' ref.)</span></div>' +
        '<div style="height:5px;background:var(--bor);border-radius:3px">' +
        '<div style="height:5px;width:' + pct + '%;background:' + c.color + ';border-radius:3px"></div></div></div>';
    }).join('') || '<div style="text-align:center;padding:16px;color:var(--hint);font-size:13px">Aucune donnee</div>';
  }

  uAB();
}

function mc(label, val, sub, mod) {
  return '<div class="mc' + (mod ? ' ' + mod : '') + '">' +
    '<div class="mc-label">' + label + '</div>' +
    '<div class="mc-val">' + val + '</div>' +
    '<div class="mc-sub">' + (sub||'') + '</div></div>';
}

/* ══════════════════════════════════════════════════════════
   ALERTES
   ══════════════════════════════════════════════════════════ */
function renderAlr() {
  var out = prods.filter(function(p) { return st(p) === 'out'; });
  var low = prods.filter(function(p) { return st(p) === 'low'; });

  var outEl = document.getElementById('alr-out-count');
  var lowEl = document.getElementById('alr-low-count');
  if (outEl) outEl.innerHTML = '<div style="font-size:36px;font-weight:800;color:var(--re)">' + out.length + '</div><div style="font-size:12px;font-weight:600;color:var(--mut);margin-top:4px">Ruptures</div>';
  if (lowEl) lowEl.innerHTML = '<div style="font-size:36px;font-weight:800;color:var(--am)">' + low.length + '</div><div style="font-size:12px;font-weight:600;color:var(--mut);margin-top:4px">Stock bas</div>';

  var all = out.map(function(p) { return Object.assign({}, p, {_type:'out'}); })
    .concat(low.map(function(p) { return Object.assign({}, p, {_type:'low'}); }));

  var el = document.getElementById('alr-list');
  if (!el) return;

  if (!all.length) {
    el.innerHTML = '<div class="es"><svg viewBox="0 0 24 24"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg><p>Aucune alerte — Tout le stock est OK !</p></div>';
    return;
  }

  el.innerHTML = all.map(function(p) {
    var icon = p._type === 'out'
      ? '<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>'
      : '<path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>';
    return '<div class="alr-item alr-' + p._type + '">' +
      '<div class="alr-icon"><svg viewBox="0 0 24 24" style="width:17px;height:17px;stroke:currentColor;fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round">' + icon + '</svg></div>' +
      '<div style="flex:1"><div style="font-size:13px;font-weight:600;margin-bottom:2px">' + p.name + '</div>' +
      '<div style="font-size:12px;color:var(--mut)"><span class="sku">' + p.sku + '</span> · ' + gcn(p.cid) + (p.sups&&p.sups.length?' · '+p.sups[0]:'') + '</div>' +
      '<div style="font-size:12px;color:var(--mut);margin-top:2px">Stock: <strong>' + p.qty + '</strong> · Seuil: ' + p.thr + (p.loc?' · '+p.loc:'') + '</div></div>' +
      '<div style="text-align:right;flex-shrink:0">' + stBadge(p) +
      '<div style="margin-top:8px"><button class="btn bp sm" onclick="quickIn(' + p.id + ')">Entree rapide</button></div></div></div>';
  }).join('');
}

/* ══════════════════════════════════════════════════════════
   STATISTIQUES
   ══════════════════════════════════════════════════════════ */
function renderStats() {
  var period = document.getElementById('stats-period');
  var v = period ? period.value : '30d';
  var ms = v === '7d' ? 7*86400000 : v === '30d' ? 30*86400000 : v === '90d' ? 90*86400000 : 0;
  var fm = ms > 0 ? mvts.filter(function(m) { return Date.now() - new Date(m.date).getTime() <= ms; }) : mvts;

  var inM  = fm.filter(function(m) { return m.type === 'in'; });
  var outM = fm.filter(function(m) { return m.type === 'out'; });
  var adjM = fm.filter(function(m) { return m.type === 'adj'; });
  var totIn  = inM.reduce(function(a,m) { return a + m.qty; }, 0);
  var totOut = outM.reduce(function(a,m) { return a + m.qty; }, 0);
  var rup = prods.filter(function(p) { return p.qty === 0 && p.stk === 'actif'; }).length;
  var alr = prods.filter(function(p) { return st(p) !== 'ok' && p.stk !== 'surcommande'; }).length;

  var lbl = { '7d':'7 derniers jours', '30d':'30 derniers jours', '90d':'3 derniers mois', all:'Depuis le debut' };
  var le = document.getElementById('stats-period-label');
  if (le) le.textContent = lbl[v] || '';

  var el = document.getElementById('stats-kpis');
  if (el) el.innerHTML =
    mc('Produits actifs', prods.filter(function(p){return p.stk==='actif';}).length, prods.length + ' references') +
    mc('Entrees', '+' + totIn, inM.length + ' operation(s)', 'gr') +
    mc('Sorties', '-' + totOut, outM.length + ' operation(s)', 'am') +
    mc('Ruptures', rup, alr + ' alerte(s)', rup > 0 ? 're' : '') +
    mc('Mouvements', fm.length, adjM.length + ' ajust.');

  // Tableau détail par catégorie
  var tbl = document.getElementById('stats-cat-table');
  if (tbl) {
    tbl.innerHTML = cats.map(function(c) {
      var ps = prods.filter(function(p) { return p.cid === c.id && p.stk === 'actif'; });
      if (!ps.length) return '';
      var u = ps.reduce(function(a,p) { return a+p.qty; }, 0);
      var outC = outM.filter(function(m) { return ps.find(function(p){return p.id===m.pid;}); });
      var totO = outC.reduce(function(a,m){return a+m.qty;},0);
      return '<tr>' +
        '<td><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:'+c.color+';margin-right:6px"></span>' + c.name + '</td>' +
        '<td>' + ps.length + '</td><td>' + u + '</td><td>' + totO + '</td></tr>';
    }).join('');
  }

  exportStatsData = { fm, inM, outM, adjM }; // pour export CSV
}

var exportStatsData = {};

function exportStatsCSV() {
  var fm = exportStatsData.fm || mvts;
  var h  = ['Date','Produit','SKU','Type','Quantite','Stock apres','Destination','Reference','Note','Operateur'];
  var rows = fm.map(function(m) {
    return [fd(m.date), m.pname, m.psku||'', m.type, m.qty, m.qtyAfter, m.dest||'', m.ref||'', m.note||'', m.user||''];
  });
  dlCSV([h].concat(rows), 'RegardsEau_Stats_' + new Date().toISOString().slice(0,10));
  toast('Export stats OK');
}

/* ══════════════════════════════════════════════════════════
   HISTORIQUE
   ══════════════════════════════════════════════════════════ */
function renderHist() {
  var q    = (document.getElementById('hist-srch') ? document.getElementById('hist-srch').value : '').toLowerCase();
  var type = document.getElementById('hist-type') ? document.getElementById('hist-type').value : '';
  var from = document.getElementById('hist-from') ? document.getElementById('hist-from').value : '';
  var to   = document.getElementById('hist-to')   ? document.getElementById('hist-to').value   : '';

  var list = mvts.slice().reverse().filter(function(m) {
    if (q && !(m.pname.toLowerCase().includes(q) || (m.ref||'').toLowerCase().includes(q) || (m.dest||'').toLowerCase().includes(q))) return false;
    if (type && m.type !== type) return false;
    if (from && new Date(m.date) < new Date(from)) return false;
    if (to   && new Date(m.date) > new Date(to + 'T23:59:59')) return false;
    return true;
  });

  var tb = document.getElementById('hist-tbody');
  if (!tb) return;

  if (!list.length) {
    tb.innerHTML = '<tr><td colspan="9"><div class="es"><p>Aucun mouvement</p></div></td></tr>';
    return;
  }

  tb.innerHTML = list.map(function(m) {
    var col  = m.type === 'in' ? 'var(--gr)' : m.type === 'out' ? 'var(--re)' : 'var(--am)';
    var sign = m.type === 'in' ? '+' : m.type === 'out' ? '-' : '';
    var badge = m.type === 'in'  ? '<span class="badge bok">Entree</span>'
              : m.type === 'out' ? '<span class="badge bout">Sortie</span>'
              : '<span class="badge blow">Ajust.</span>';
    return '<tr>' +
      '<td style="font-size:12px;color:var(--mut);white-space:nowrap">' + fd(m.date) + '</td>' +
      '<td style="font-weight:500">' + m.pname + '</td>' +
      '<td><span class="sku">' + (m.psku||'--') + '</span></td>' +
      '<td>' + badge + '</td>' +
      '<td style="font-weight:700;color:' + col + '">' + sign + m.qty + '</td>' +
      '<td style="font-family:monospace">' + m.qtyAfter + '</td>' +
      '<td style="font-size:12px;color:var(--mut)">' + (m.dest||'--') + '</td>' +
      '<td style="font-size:12px;color:var(--mut)">' + (m.ref||'--') + '</td>' +
      '<td style="font-size:12px;color:var(--mut)">' + (m.user||'--') + '</td>' +
    '</tr>';
  }).join('');
}

function clearHist() {
  if (!confirm('Effacer tout l\'historique des mouvements ? Les stocks ne seront pas affectes.')) return;
  mvts = [];
  sv(true); renderHist(); toast('Historique efface', 'er');
}

function exportHistCSV() {
  var h = ['Date','Produit','SKU','Type','Quantite','Stock apres','Destination','Reference','Note','Operateur'];
  var rows = mvts.map(function(m) {
    return [fd(m.date), m.pname, m.psku||'', m.type, m.qty, m.qtyAfter, m.dest||'', m.ref||'', m.note||'', m.user||''];
  });
  dlCSV([h].concat(rows), 'RegardsEau_Hist_' + new Date().toISOString().slice(0,10));
  toast('Export OK');
}

/* ══════════════════════════════════════════════════════════
   CATEGORIES
   ══════════════════════════════════════════════════════════ */
var editCatId = null;

function renderCats() {
  var el = document.getElementById('cats-grid');
  if (!el) return;

  if (!cats.length) {
    el.innerHTML = '<div class="es"><p>Aucune categorie</p></div>';
    return;
  }

  var editIco = svgIcon('<path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>');

  el.innerHTML = cats.map(function(c) {
    var n   = prods.filter(function(p) { return p.cid === c.id; }).length;
    var qty = prods.filter(function(p) { return p.cid === c.id; }).reduce(function(a,p) { return a+p.qty; }, 0);
    return '<div class="card" style="border-top:4px solid ' + c.color + '">' +
      '<div class="card-hd"><div class="card-title">' + c.name + '</div>' +
      '<button class="btn ic sm" onclick="openEditCat(' + c.id + ')">' + editIco + '</button></div>' +
      '<div class="card-body">' +
      '<div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:10px">' +
      '<span style="color:var(--mut)">' + n + ' produit(s)</span>' +
      '<span style="font-weight:700;color:var(--gr)">' + qty + ' unites en stock</span></div>' +
      '<div style="display:flex;gap:5px;flex-wrap:wrap">' +
      (c.subs||[]).map(function(s) {
        return '<span style="font-size:11px;background:' + c.color + '22;color:' + c.color + ';padding:2px 9px;border-radius:20px;font-weight:600">' + s + '</span>';
      }).join('') + '</div></div></div>';
  }).join('');
}

function openAddCat() {
  editCatId = null;
  document.getElementById('mo-cat-title').textContent = 'Nouvelle categorie';
  document.getElementById('fc-del').style.display = 'none';
  document.getElementById('fc-name').value  = '';
  document.getElementById('fc-color').value = '#4BA3C3';
  document.getElementById('fc-subs').value  = '';
  openMo('mo-cat');
}

function openEditCat(id) {
  var c = cats.find(function(c) { return c.id === id; });
  if (!c) return;
  editCatId = id;
  document.getElementById('mo-cat-title').textContent = 'Modifier la categorie';
  document.getElementById('fc-del').style.display = 'inline-flex';
  document.getElementById('fc-name').value  = c.name;
  document.getElementById('fc-color').value = c.color || '#4BA3C3';
  document.getElementById('fc-subs').value  = (c.subs||[]).join('\n');
  openMo('mo-cat');
}

function saveCat() {
  var name = document.getElementById('fc-name').value.trim();
  if (!name) { toast('Nom obligatoire', 'er'); return; }
  var c = {
    id:    editCatId || ncid++,
    name:  name,
    color: document.getElementById('fc-color').value,
    subs:  document.getElementById('fc-subs').value.split('\n').map(function(s){return s.trim();}).filter(Boolean),
  };
  if (editCatId) { var i = cats.findIndex(function(x){return x.id===editCatId;}); cats[i] = c; }
  else cats.push(c);
  sv(true); closeMo('mo-cat'); renderCats();
  toast(editCatId ? 'Categorie modifiee' : 'Categorie ajoutee');
}

function delCat() {
  if (prods.some(function(p){return p.cid===editCatId;})) { toast('Des produits utilisent cette categorie', 'er'); return; }
  if (!confirm('Supprimer cette categorie ?')) return;
  cats = cats.filter(function(c){return c.id!==editCatId;});
  sv(true); closeMo('mo-cat'); renderCats(); toast('Categorie supprimee', 'er');
}

/* ══════════════════════════════════════════════════════════
   FOURNISSEURS
   ══════════════════════════════════════════════════════════ */
var editSupId = null;

function renderSups() {
  var editIco = svgIcon('<path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>');

  var grid = document.getElementById('sups-grid');
  if (grid) {
    grid.innerHTML = sups.map(function(s) {
      var n = prods.filter(function(p){return(p.sups||[]).includes(s.name);}).length;
      return '<div class="sup-card">' +
        '<div style="display:flex;justify-content:space-between;align-items:flex-start">' +
        '<div><div style="font-size:14px;font-weight:700;margin-bottom:4px">' + s.name + '</div>' +
        (s.contact ? '<div style="font-size:12px;color:var(--mut)">' + s.contact + '</div>' : '') +
        (s.phone   ? '<div style="font-size:12px;color:var(--mut)">' + s.phone   + '</div>' : '') +
        (s.email   ? '<div style="font-size:12px;color:var(--mut)">' + s.email   + '</div>' : '') +
        '<div style="font-size:11px;color:var(--hint);margin-top:6px">' + n + ' produit(s)</div></div>' +
        '<button class="btn ic sm" onclick="openEditSup(' + s.id + ')">' + editIco + '</button></div>' +
        (s.notes ? '<div style="font-size:12px;color:var(--mut);font-style:italic;margin-top:8px;padding-top:8px;border-top:1px solid var(--bor)">' + s.notes + '</div>' : '') +
        '</div>';
    }).join('');
  }

  var tb = document.getElementById('sups-tbody');
  if (tb) {
    tb.innerHTML = sups.map(function(s) {
      return '<tr>' +
        '<td style="font-weight:600">' + s.name + '</td>' +
        '<td>' + (s.contact||'--') + '</td>' +
        '<td>' + (s.phone||'--') + '</td>' +
        '<td>' + (s.email ? '<a href="mailto:'+s.email+'" style="color:var(--bl)">'+s.email+'</a>' : '--') + '</td>' +
        '<td style="font-size:12px;color:var(--mut)">' + (s.notes||'--') + '</td>' +
        '<td><button class="btn ic sm" onclick="openEditSup('+s.id+')">' + editIco + '</button></td>' +
      '</tr>';
    }).join('');
  }
}

function openAddSup() {
  editSupId = null;
  document.getElementById('mo-sup-title').textContent = 'Nouveau fournisseur';
  document.getElementById('fs-del').style.display = 'none';
  ['fs-name','fs-contact','fs-phone','fs-email','fs-web','fs-notes'].forEach(function(id){document.getElementById(id).value='';});
  openMo('mo-sup');
}

function openEditSup(id) {
  var s = sups.find(function(s){return s.id===id;});
  if (!s) return;
  editSupId = id;
  document.getElementById('mo-sup-title').textContent = 'Modifier fournisseur';
  document.getElementById('fs-del').style.display = 'inline-flex';
  document.getElementById('fs-name').value    = s.name;
  document.getElementById('fs-contact').value = s.contact||'';
  document.getElementById('fs-phone').value   = s.phone||'';
  document.getElementById('fs-email').value   = s.email||'';
  document.getElementById('fs-web').value     = s.web||'';
  document.getElementById('fs-notes').value   = s.notes||'';
  openMo('mo-sup');
}

function saveSup() {
  var name = document.getElementById('fs-name').value.trim();
  if (!name) { toast('Nom obligatoire', 'er'); return; }
  var s = {
    id:      editSupId || nsid++,
    name:    name,
    contact: document.getElementById('fs-contact').value.trim(),
    phone:   document.getElementById('fs-phone').value.trim(),
    email:   document.getElementById('fs-email').value.trim(),
    web:     document.getElementById('fs-web').value.trim(),
    notes:   document.getElementById('fs-notes').value.trim(),
  };
  if (editSupId) { var i = sups.findIndex(function(x){return x.id===editSupId;}); sups[i]=s; }
  else sups.push(s);
  sv(true); closeMo('mo-sup'); renderSups(); toast(editSupId ? 'Fournisseur modifie' : 'Fournisseur ajoute');
}

function delSup() {
  if (!confirm('Supprimer ce fournisseur ?')) return;
  sups = sups.filter(function(s){return s.id!==editSupId;});
  sv(true); closeMo('mo-sup'); renderSups(); toast('Fournisseur supprime', 'er');
}

/* ══════════════════════════════════════════════════════════
   UTILISATEURS
   ══════════════════════════════════════════════════════════ */
var editUserId = null;

function renderUsers() {
  var el = document.getElementById('users-list');
  if (!el) return;
  var editIco = svgIcon('<path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>');

  el.innerHTML = users.map(function(u) {
    return '<div style="background:var(--sur);border:1px solid var(--bor);border-radius:var(--rl);padding:13px 15px;display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:8px;box-shadow:var(--sh)">' +
      '<div style="display:flex;align-items:center;gap:12px">' +
      '<div style="width:38px;height:38px;border-radius:50%;background:var(--bl);color:#fff;font-size:13px;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0">' + initials(u.full||u.name) + '</div>' +
      '<div><div style="font-size:14px;font-weight:700">' + (u.full||u.name) + '</div>' +
      '<div style="font-size:12px;color:var(--mut)">' + u.name + ' · ' + roleLabel(u.role) + '</div></div></div>' +
      '<div style="display:flex;align-items:center;gap:8px">' +
      '<span class="badge" style="background:var(--bll);color:var(--bl)">' + roleLabel(u.role) + '</span>' +
      '<button class="btn ic sm" onclick="openEditUser(' + u.id + ')">' + editIco + '</button></div></div>';
  }).join('');
}

function openAddUser() {
  editUserId = null;
  document.getElementById('mo-user-title').textContent = 'Nouvel utilisateur';
  document.getElementById('fu-del').style.display = 'none';
  ['fu-full','fu-name','fu-pass'].forEach(function(id){document.getElementById(id).value='';});
  document.getElementById('fu-role').value = 'admin';
  openMo('mo-user');
}

function openEditUser(id) {
  var u = users.find(function(u){return u.id===id;});
  if (!u) return;
  editUserId = id;
  document.getElementById('mo-user-title').textContent = 'Modifier utilisateur';
  document.getElementById('fu-del').style.display = u.id === currentUser.id ? 'none' : 'inline-flex';
  document.getElementById('fu-full').value = u.full||'';
  document.getElementById('fu-name').value = u.name;
  document.getElementById('fu-pass').value = '';
  document.getElementById('fu-role').value = u.role;
  openMo('mo-user');
}

function saveUser() {
  var full = document.getElementById('fu-full').value.trim();
  var name = document.getElementById('fu-name').value.trim().toLowerCase();
  var pass = document.getElementById('fu-pass').value;
  if (!full || !name) { toast('Nom et identifiant obligatoires', 'er'); return; }
  if (!editUserId && pass.length < 6) { toast('Mot de passe min. 6 caracteres', 'er'); return; }
  if (!editUserId && users.find(function(u){return u.name===name;})) { toast('Identifiant deja utilise', 'er'); return; }

  var uid = editUserId || (users.reduce(function(m,u){return Math.max(m,u.id);},0)+1);
  var existing = editUserId ? users.find(function(u){return u.id===editUserId;}) : null;
  var u = {
    id:   uid,
    full: full,
    name: name,
    pwd:  pass.length >= 6 ? hashPwd(pass) : (existing ? existing.pwd : ''),
    role: document.getElementById('fu-role').value,
  };
  if (editUserId) { var i = users.findIndex(function(x){return x.id===editUserId;}); users[i]=u; }
  else users.push(u);
  saveUsers(users); closeMo('mo-user'); renderUsers(); toast(editUserId?'Utilisateur modifie':'Utilisateur ajoute');
}

function delUser() {
  if (editUserId === currentUser.id) { toast('Impossible de supprimer votre propre compte', 'er'); return; }
  if (!confirm('Supprimer cet utilisateur ?')) return;
  users = users.filter(function(u){return u.id!==editUserId;});
  saveUsers(users); closeMo('mo-user'); renderUsers(); toast('Utilisateur supprime', 'er');
}

/* ══════════════════════════════════════════════════════════
   BACKUP
   ══════════════════════════════════════════════════════════ */
function dlBackup() {
  var data = {
    version: CFG.VERSION,
    app:     CFG.APP,
    date:    new Date().toISOString(),
    dateFr:  new Date().toLocaleString('fr-FR'),
    cats, sups, prods, mvts, nid, nmid, ncid, nsid,
  };
  var blob = new Blob([JSON.stringify(data, null, 2)], { type:'application/json' });
  var a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'RegardsEau_Stock_' + new Date().toISOString().slice(0,10) + '.json';
  a.click();

  var log = getBakLog();
  log.unshift({ date:new Date().toISOString(), dateFr:new Date().toLocaleString('fr-FR'), pc:prods.length, mc:mvts.length, cc:cats.length, sc:sups.length });
  if (log.length > 20) log.splice(20);
  localStorage.setItem(CFG.BLK, JSON.stringify(log));
  localStorage.setItem(CFG.LBK, new Date().toISOString());
  toast('Sauvegarde telechargee !', 'ok');
  renderBakLog(); rBB('bbanner'); rBB('bbanner2');
}

function restoreBackup(inp) {
  var file = inp.files[0];
  if (!file) return;
  var r = new FileReader();
  r.onload = function(e) {
    try {
      var data = JSON.parse(e.target.result);
      if (!data.prods || !Array.isArray(data.prods)) throw new Error('Format invalide');
      if (!confirm('Restaurer la sauvegarde du ' + (data.dateFr||data.date) + ' ?\nVos donnees actuelles seront remplacees.')) return;
      cats  = data.cats  || cats;
      sups  = data.sups  || [];
      prods = data.prods;
      mvts  = data.mvts  || [];
      nid   = data.nid   || (Math.max(0, ...prods.map(function(p){return p.id;})) + 1);
      nmid  = data.nmid  || (Math.max(0, ...mvts.map(function(m){return m.id;}))  + 1);
      ncid  = data.ncid  || (Math.max(0, ...cats.map(function(c){return c.id;}))  + 1);
      nsid  = data.nsid  || (Math.max(0, ...sups.map(function(s){return s.id;}))  + 1);
      sv(true); inp.value = '';
      toast('Restauration reussie', 'ok');
      showPage('dash');
    } catch(err) { toast('Fichier invalide', 'er'); inp.value = ''; }
  };
  r.readAsText(file);
}

function getBakLog() {
  try { return JSON.parse(localStorage.getItem(CFG.BLK) || '[]'); } catch(e) { return []; }
}

function renderBakLog() {
  var el = document.getElementById('baklog');
  if (!el) return;
  var log = getBakLog();
  if (!log.length) {
    el.innerHTML = '<div style="color:var(--hint);font-size:13px;padding:12px 0">Aucune sauvegarde enregistree</div>';
    return;
  }
  el.innerHTML = '<div class="tw"><table><thead><tr><th>Date</th><th>Produits</th><th>Categories</th><th>Fournisseurs</th><th>Mouvements</th></tr></thead><tbody>' +
    log.map(function(l) {
      return '<tr><td style="font-size:12px">' + l.dateFr + '</td><td>' + l.pc + '</td><td>' + (l.cc||'--') + '</td><td>' + (l.sc||'--') + '</td><td>' + l.mc + '</td></tr>';
    }).join('') + '</tbody></table></div>';
}
