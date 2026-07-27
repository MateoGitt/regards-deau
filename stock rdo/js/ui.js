/* ============================================================
   ui.js — Navigation, modals, toast, dark mode, helpers UI
   ============================================================ */

var PAGE_TITLES = {
  dash:    'Tableau de bord',
  prod:    'Produits & Stock',
  mvt:     'Mouvements de stock',
  cats:    'Categories',
  sups:    'Fournisseurs',
  alr:     'Alertes de stock',
  stats:   'Statistiques',
  hist:    'Historique',
  users:   'Utilisateurs',
  bak:     'Sauvegardes',
};

/* ── NAVIGATION ─────────────────────────────────────────── */
function showPage(p) {
  document.querySelectorAll('.pg').forEach(function(e) { e.classList.remove('active'); });
  document.querySelectorAll('.ni').forEach(function(e) { e.classList.remove('active'); });

  var pg  = document.getElementById('pg-' + p);
  var nav = document.getElementById('nav-' + p);
  if (pg)  pg.classList.add('active');
  if (nav) nav.classList.add('active');

  document.getElementById('ptitle').textContent = PAGE_TITLES[p] || p;
  topbarActionsFor(p);
  closeSb();

  // Render de la page
  if (p === 'dash')  renderDash();
  if (p === 'prod')  { fillProdFilters(); renderProd(); }
  if (p === 'mvt')   { fillMvtProd(); renderMvtHist(); }
  if (p === 'cats')  renderCats();
  if (p === 'sups')  renderSups();
  if (p === 'alr')   renderAlr();
  if (p === 'stats') renderStats();
  if (p === 'hist')  renderHist();
  if (p === 'users') renderUsers();
  if (p === 'bak')   { renderBakLog(); rBB('bbanner2'); }
}

/* Boutons contextuels dans la topbar */
function topbarActionsFor(p) {
  var a = document.getElementById('topbar-actions');
  a.innerHTML = '';

  var save = '<button class="btn bna sm" onclick="sv(false)">' + svgIcon('<path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>') + 'Sauvegarder</button>';
  var dl   = svgIcon('<path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>');
  var plus = svgIcon('<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>');

  if (p === 'prod')  a.innerHTML = '<button class="btn sm" onclick="exportProdCSV()">' + dl + 'Export CSV</button><button class="btn sm" onclick="openImportCSV()">Import CSV</button><button class="btn bp sm" onclick="openAddProd()">' + plus + 'Nouveau produit</button>';
  if (p === 'cats')  a.innerHTML = '<button class="btn bp sm" onclick="openAddCat()">' + plus + 'Nouvelle categorie</button>';
  if (p === 'sups')  a.innerHTML = '<button class="btn bp sm" onclick="openAddSup()">' + plus + 'Nouveau fournisseur</button>';
  if (p === 'hist')  a.innerHTML = '<button class="btn sm" onclick="exportHistCSV()">' + dl + 'Export CSV</button><button class="btn bds sm" onclick="clearHist()">Effacer</button>';
  if (p === 'bak')   a.innerHTML = '<button class="btn bna sm" onclick="dlBackup()">' + dl + 'Sauvegarder</button>';
  if (p === 'users') a.innerHTML = '<button class="btn bp sm" onclick="openAddUser()">' + plus + 'Ajouter</button>';
  if (p === 'stats') a.innerHTML = '<button class="btn sm" onclick="exportStatsCSV()">' + dl + 'Export CSV</button>';

  a.innerHTML += save;
}

/* ── SIDEBAR ────────────────────────────────────────────── */
function toggleSb() { document.body.classList.toggle('sidebar-open'); }
function closeSb()  { document.body.classList.remove('sidebar-open'); }

/* ── DARK MODE ──────────────────────────────────────────── */
function toggleDark() {
  document.body.classList.toggle('dark');
  localStorage.setItem(CFG.DK, document.body.classList.contains('dark') ? '1' : '');
}

/* ── MODALS ─────────────────────────────────────────────── */
function openMo(id) {
  document.getElementById(id).classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeMo(id) {
  document.getElementById(id).classList.remove('open');
  document.body.style.overflow = '';
}

/* Fermer en cliquant sur l'overlay */
function initModals() {
  document.querySelectorAll('.mo').forEach(function(mo) {
    mo.addEventListener('click', function(e) {
      if (e.target === mo) closeMo(mo.id);
    });
  });
}

/* ── TOAST ──────────────────────────────────────────────── */
function toast(msg, type) {
  var t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'toast show ' + (type || 'ok');
  clearTimeout(t._t);
  t._t = setTimeout(function() { t.className = 'toast'; }, 3500);
}

/* ── BANNER SAUVEGARDE ──────────────────────────────────── */
function rBB(elId) {
  var el = document.getElementById(elId || 'bbanner');
  if (!el) return;
  var lb   = localStorage.getItem(CFG.LBK);
  var days = lb ? Math.floor((Date.now() - new Date(lb)) / 86400000) : 999;
  if (!lb || days >= 1) {
    el.innerHTML = '<div class="save-banner">' +
      svgIcon('<path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/>') +
      '<span>' + (!lb ? 'Premiere utilisation — Pensez a creer une sauvegarde.' : 'Aucune sauvegarde depuis ' + days + ' jour(s).') + '</span>' +
      '<button class="btn sm bna" onclick="dlBackup()">Sauvegarder</button>' +
      '</div>';
  } else {
    el.innerHTML = '';
  }
}

/* ── GLOBAL SEARCH ──────────────────────────────────────── */
function globalSearch(q) {
  if (!q || q.length < 2) return;
  var ql  = q.toLowerCase();
  var res = prods.filter(function(p) {
    return p.name.toLowerCase().includes(ql) || p.sku.toLowerCase().includes(ql);
  });
  if (res.length) {
    showPage('prod');
    var s = document.getElementById('prod-srch');
    if (s) { s.value = q; renderProd(); }
  }
}
