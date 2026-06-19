// ═══════════════════════════════════════════════════════════
// AUTHENTIFICATION
// ═══════════════════════════════════════════════════════════

const AUTH = (() => {
  const SESSION_KEY = 'aquapro_session';

  const ROLES = {
    admin:      { label: 'Administrateur', level: 4 },
    patron:     { label: 'Patron',         level: 3 },
    commercial: { label: 'Commercial',     level: 2 },
    technicien: { label: 'Technicien',     level: 1 },
  };

  // Pages accessibles par rôle
  const ACCESS = {
    dashboard:   ['admin','patron','commercial','technicien'],
    planning:    ['admin','patron','technicien'],
    fiches:      ['admin','patron','technicien'],
    clients:     ['admin','patron','commercial'],
    chantiers:   ['admin','patron','commercial'],
    stock:       ['admin','patron'],
    stats:       ['admin','patron','commercial'],
    equipe:      ['admin','patron'],
    settings:    ['admin'],
  };

  let currentUser = null;

  function login(email, password) {
    const users = DB.getAll('users');
    const user = users.find(u => u.email === email && u.password === password && u.active);
    if (!user) return false;
    currentUser = user;
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(user));
    return true;
  }

  function logout() {
    currentUser = null;
    sessionStorage.removeItem(SESSION_KEY);
  }

  function checkSession() {
    try {
      const data = sessionStorage.getItem(SESSION_KEY);
      if (data) {
        currentUser = JSON.parse(data);
        return true;
      }
    } catch {}
    return false;
  }

  function getUser() { return currentUser; }

  function canAccess(page) {
    if (!currentUser) return false;
    return (ACCESS[page] || []).includes(currentUser.role);
  }

  function isAtLeast(role) {
    if (!currentUser) return false;
    return (ROLES[currentUser.role]?.level || 0) >= (ROLES[role]?.level || 0);
  }

  function getRoleLabel(role) {
    return ROLES[role]?.label || role;
  }

  return { login, logout, checkSession, getUser, canAccess, isAtLeast, getRoleLabel, ROLES, ACCESS };
})();

window.AUTH = AUTH;
