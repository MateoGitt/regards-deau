const APP = (() => {

  // Icônes SVG Heroicons (stroke, 1.75px)
  const ICONS = {
    dashboard:  '<svg viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>',
    planning:   '<svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>',
    fiches:     '<svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>',
    clients:    '<svg viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>',
    chantiers:  '<svg viewBox="0 0 24 24"><path d="M2 20h20M4 20V10l8-8 8 8v10M10 20v-5h4v5"/></svg>',
    stock:      '<svg viewBox="0 0 24 24"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>',
    stats:      '<svg viewBox="0 0 24 24"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>',
    equipe:     '<svg viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>',
    settings:   '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>',
    logout:     '<svg viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>',
    plus:       '<svg viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>',
    search:     '<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>',
  };

  const PAGES = {
    dashboard: { title: 'Tableau de bord', icon: 'dashboard', section: 'Principal' },
    planning:  { title: 'Planning',         icon: 'planning',  section: 'Principal' },
    fiches:    { title: "Fiches d'intervention", icon: 'fiches', section: 'Principal' },
    clients:   { title: 'Clients',          icon: 'clients',   section: 'Gestion' },
    chantiers: { title: 'Chantiers',        icon: 'chantiers', section: 'Gestion' },
    stock:     { title: 'Stock',            icon: 'stock',     section: 'Gestion' },
    stats:     { title: 'Statistiques',     icon: 'stats',     section: 'Analyse' },
    equipe:    { title: 'Équipe',           icon: 'equipe',    section: 'Configuration' },
    settings:  { title: 'Paramètres',      icon: 'settings',  section: 'Configuration' },
  };

  function init() {
    DB.initDemo();
    if (!AUTH.checkSession()) { showLogin(); return; }
    startApp();
  }

  function showLogin() {
    document.getElementById('login-screen').style.display = 'flex';
    document.getElementById('app').style.display = 'none';
    document.getElementById('login-form').addEventListener('submit', e => {
      e.preventDefault();
      const email = document.getElementById('login-email').value;
      const pass  = document.getElementById('login-password').value;
      const err   = document.getElementById('login-error');
      if (AUTH.login(email, pass)) {
        document.getElementById('login-screen').style.display = 'none';
        document.getElementById('app').style.display = 'flex';
        startApp();
      } else {
        err.style.display = 'block';
        err.textContent = 'Email ou mot de passe incorrect.';
      }
    });
    setTimeout(() => document.getElementById('login-email')?.focus(), 100);
  }

  function startApp() {
    buildSidebar();
    buildBottomNav();
    setupTopbar();
    const user = AUTH.getUser();
    goPage(user.role === 'technicien' ? 'planning' : 'dashboard');
  }

  function buildSidebar() {
    const user = AUTH.getUser();
    // User avatar
    document.getElementById('sidebar-user').innerHTML = `
      <div class="user-avatar" style="background:${user.color}">${U.initials(user.name)}</div>
      <div class="user-info">
        <div class="user-name">${user.name}</div>
        <div class="user-role">${AUTH.getRoleLabel(user.role)}</div>
      </div>`;

    // Navigation par sections
    const nav = document.getElementById('sidebar-nav');
    nav.innerHTML = '';
    const sections = {};
    Object.entries(PAGES).forEach(([id, p]) => {
      if (!AUTH.canAccess(id)) return;
      if (!sections[p.section]) sections[p.section] = [];
      sections[p.section].push({ id, ...p });
    });
    Object.entries(sections).forEach(([sec, pages]) => {
      const label = document.createElement('div');
      label.className = 'nav-section';
      label.textContent = sec;
      nav.appendChild(label);
      pages.forEach(p => {
        const item = document.createElement('div');
        item.className = 'nav-item';
        item.dataset.page = p.id;
        item.innerHTML = `${ICONS[p.icon] || ''}<span>${p.title}</span>`;
        item.addEventListener('click', () => goPage(p.id));
        nav.appendChild(item);
      });
    });

    // Logout
    document.getElementById('sidebar-bottom').innerHTML = `
      <div class="nav-item logout" id="btn-logout">${ICONS.logout}<span>Déconnexion</span></div>`;
    document.getElementById('btn-logout').addEventListener('click', () => {
      AUTH.logout(); location.reload();
    });
  }

  function buildBottomNav() {
    const user = AUTH.getUser();
    const mobilePages = user.role === 'technicien'
      ? ['dashboard','planning','fiches']
      : ['dashboard','planning','fiches','clients','stock'];
    const pages = mobilePages.filter(p => AUTH.canAccess(p));
    document.getElementById('bottom-nav').innerHTML = `
      <div class="bottom-nav-items">
        ${pages.map(id => `
          <div class="bottom-nav-item" data-page="${id}">
            ${ICONS[PAGES[id].icon] || ''}
            <span>${PAGES[id].title.split(' ')[0]}</span>
          </div>`).join('')}
      </div>`;
    document.querySelectorAll('.bottom-nav-item').forEach(el => {
      el.addEventListener('click', () => goPage(el.dataset.page));
    });
  }

  function setupTopbar() {
    const menuBtn = document.getElementById('menu-toggle');
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    menuBtn.addEventListener('click', () => {
      sidebar.classList.toggle('open');
      overlay.classList.toggle('open');
    });
    document.getElementById('btn-dark-mode').addEventListener('click', () => {
      document.body.classList.toggle('dark');
      localStorage.setItem('regards_dark', document.body.classList.contains('dark') ? '1' : '');
    });
    if (localStorage.getItem('regards_dark')) document.body.classList.add('dark');

    // Responsive
    const checkMobile = () => {
      menuBtn.style.display = window.innerWidth <= 768 ? 'flex' : 'none';
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);

    // Mode démo badge
    if (window.DEMO_MODE) {
      const badge = document.createElement('div');
      badge.className = 'badge badge-warning';
      badge.textContent = 'Mode démo';
      document.getElementById('topbar').appendChild(badge);
    }
  }

  function goPage(pageId) {
    if (!AUTH.canAccess(pageId)) { U.toast('Accès non autorisé', 'error'); return; }
    // Pages
    document.querySelectorAll('.page').forEach(el => el.classList.remove('active'));
    document.getElementById(`page-${pageId}`)?.classList.add('active');
    // Nav items
    document.querySelectorAll('.nav-item[data-page]').forEach(el => el.classList.toggle('active', el.dataset.page === pageId));
    document.querySelectorAll('.bottom-nav-item[data-page]').forEach(el => el.classList.toggle('active', el.dataset.page === pageId));
    // Titre
    document.getElementById('topbar-title').textContent = PAGES[pageId]?.title || pageId;
    // Fermer sidebar mobile
    document.getElementById('sidebar')?.classList.remove('open');
    document.getElementById('sidebar-overlay')?.classList.remove('open');
    // Rendu
    const renders = { dashboard: DASH.render, planning: PLANNING.render, fiches: FICHES.render, clients: CLIENTS.render, chantiers: CHANTIERS.render, stock: STOCK.render, stats: STATS.render, equipe: EQUIPE.render, settings: SETTINGS.render };
    renders[pageId]?.call(renders[pageId] === DASH.render ? DASH : renders[pageId] === PLANNING.render ? PLANNING : renders[pageId] === FICHES.render ? FICHES : renders[pageId] === CLIENTS.render ? CLIENTS : renders[pageId] === CHANTIERS.render ? CHANTIERS : renders[pageId] === STOCK.render ? STOCK : renders[pageId] === STATS.render ? STATS : renders[pageId] === EQUIPE.render ? EQUIPE : SETTINGS);
  }

  return { init, goPage, PAGES, ICONS };
})();

window.APP = APP;
document.addEventListener('DOMContentLoaded', APP.init);
