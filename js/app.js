// ═══════════════════════════════════════════════════════════
// APPLICATION PRINCIPALE
// ═══════════════════════════════════════════════════════════

const APP = (() => {

  const PAGES = {
    dashboard:  { title: 'Tableau de bord', icon: '📊', nav: 'main' },
    planning:   { title: 'Planning',         icon: '📅', nav: 'main' },
    fiches:     { title: 'Fiches',           icon: '📋', nav: 'main' },
    clients:    { title: 'Clients',          icon: '👥', nav: 'main' },
    chantiers:  { title: 'Chantiers',        icon: '🏗️',  nav: 'main' },
    stock:      { title: 'Stock',            icon: '📦', nav: 'stock' },
    stats:      { title: 'Statistiques',     icon: '📈', nav: 'main' },
    equipe:     { title: 'Équipe',           icon: '👤', nav: 'config' },
    settings:   { title: 'Paramètres',      icon: '⚙️',  nav: 'config' },
  };

  let currentPage = 'dashboard';

  // ── Initialisation ────────────────────────────────────────
  function init() {
    DB.initDemo();

    if (!AUTH.checkSession()) {
      showLogin();
      return;
    }
    startApp();
  }

  function showLogin() {
    document.getElementById('login-screen').style.display = 'flex';
    document.getElementById('app').style.display = 'none';

    document.getElementById('login-form').addEventListener('submit', e => {
      e.preventDefault();
      const email = document.getElementById('login-email').value;
      const pass = document.getElementById('login-password').value;
      const err = document.getElementById('login-error');

      if (AUTH.login(email, pass)) {
        document.getElementById('login-screen').style.display = 'none';
        document.getElementById('app').style.display = 'flex';
        startApp();
      } else {
        err.style.display = 'block';
        err.textContent = 'Email ou mot de passe incorrect.';
      }
    });
  }

  function startApp() {
    const user = AUTH.getUser();
    buildSidebar(user);
    buildBottomNav(user);
    setupTopbar();

    // Page par défaut selon rôle
    if (user.role === 'technicien') {
      goPage('planning');
    } else {
      goPage('dashboard');
    }
  }

  // ── Sidebar ───────────────────────────────────────────────
  function buildSidebar(user) {
    // User info
    document.getElementById('sidebar-user').innerHTML = `
      <div class="user-avatar" style="background:${user.color}">${U.initials(user.name)}</div>
      <div class="user-info">
        <div class="user-name">${user.name}</div>
        <div class="user-role">${AUTH.getRoleLabel(user.role)}</div>
      </div>`;

    const nav = document.getElementById('sidebar-nav');
    nav.innerHTML = '';

    const sections = [
      { label: 'Principal', pages: ['dashboard','planning','fiches','clients','chantiers'] },
      { label: 'Gestion', pages: ['stock','stats'] },
      { label: 'Configuration', pages: ['equipe','settings'] },
    ];

    sections.forEach(sec => {
      const visiblePages = sec.pages.filter(p => AUTH.canAccess(p));
      if (!visiblePages.length) return;

      const secEl = document.createElement('div');
      secEl.className = 'nav-section';
      secEl.textContent = sec.label;
      nav.appendChild(secEl);

      visiblePages.forEach(pageId => {
        const p = PAGES[pageId];
        const item = document.createElement('div');
        item.className = 'nav-item';
        item.dataset.page = pageId;
        item.innerHTML = `<span class="nav-icon">${p.icon}</span><span>${p.title}</span>`;
        item.addEventListener('click', () => goPage(pageId));
        nav.appendChild(item);
      });
    });

    // Logout
    document.getElementById('sidebar-bottom').innerHTML = `
      <div class="nav-item logout" id="btn-logout">
        <span class="nav-icon">🚪</span><span>Déconnexion</span>
      </div>`;
    document.getElementById('btn-logout').addEventListener('click', () => {
      AUTH.logout();
      location.reload();
    });
  }

  // ── Bottom nav mobile ─────────────────────────────────────
  function buildBottomNav(user) {
    const pages = user.role === 'technicien'
      ? ['planning','fiches']
      : ['dashboard','planning','fiches','clients','stock'];

    const visiblePages = pages.filter(p => AUTH.canAccess(p));
    const items = visiblePages.map(p => `
      <div class="bottom-nav-item" data-page="${p}">
        <span class="bn-icon">${PAGES[p].icon}</span>
        <span>${PAGES[p].title}</span>
      </div>`).join('');

    document.getElementById('bottom-nav').innerHTML = `<div class="bottom-nav-items">${items}</div>`;
    document.querySelectorAll('.bottom-nav-item').forEach(el => {
      el.addEventListener('click', () => goPage(el.dataset.page));
    });
  }

  // ── Topbar ────────────────────────────────────────────────
  function setupTopbar() {
    document.getElementById('menu-toggle')?.addEventListener('click', () => {
      document.getElementById('sidebar').classList.toggle('open');
    });

    document.getElementById('btn-dark-mode')?.addEventListener('click', () => {
      document.body.classList.toggle('dark');
      localStorage.setItem('aquapro_dark', document.body.classList.contains('dark') ? '1' : '0');
    });

    if (localStorage.getItem('aquapro_dark') === '1') {
      document.body.classList.add('dark');
    }

    // Demo badge
    if (window.DEMO_MODE) {
      const badge = document.createElement('div');
      badge.style.cssText = 'background:#f59e0b;color:#fff;font-size:11px;font-weight:700;padding:3px 10px;border-radius:20px;';
      badge.textContent = '⚠️ Mode Démo';
      document.getElementById('topbar').appendChild(badge);
    }
  }

  // ── Navigation ────────────────────────────────────────────
  function goPage(pageId) {
    if (!AUTH.canAccess(pageId)) { U.toast('Accès non autorisé', 'error'); return; }

    currentPage = pageId;
    const p = PAGES[pageId];

    // Update UI
    document.querySelectorAll('.page').forEach(el => el.classList.remove('active'));
    document.getElementById(`page-${pageId}`)?.classList.add('active');

    document.querySelectorAll('.nav-item[data-page]').forEach(el => {
      el.classList.toggle('active', el.dataset.page === pageId);
    });
    document.querySelectorAll('.bottom-nav-item[data-page]').forEach(el => {
      el.classList.toggle('active', el.dataset.page === pageId);
    });

    document.getElementById('topbar-title').textContent = p.title;
    document.getElementById('sidebar').classList.remove('open');

    // Charger la page
    loadPage(pageId);
  }

  function loadPage(pageId) {
    switch(pageId) {
      case 'dashboard':  DASH.render(); break;
      case 'planning':   PLANNING.render(); break;
      case 'fiches':     FICHES.render(); break;
      case 'clients':    CLIENTS.render(); break;
      case 'chantiers':  CHANTIERS.render(); break;
      case 'stock':      STOCK.render(); break;
      case 'stats':      STATS.render(); break;
      case 'equipe':     EQUIPE.render(); break;
      case 'settings':   SETTINGS.render(); break;
    }
  }

  function getCurrentPage() { return currentPage; }

  return { init, goPage, getCurrentPage, PAGES };
})();

window.APP = APP;
document.addEventListener('DOMContentLoaded', APP.init);
