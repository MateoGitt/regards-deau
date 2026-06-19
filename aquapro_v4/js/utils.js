// ═══════════════════════════════════════════════════════════
// UTILITAIRES
// ═══════════════════════════════════════════════════════════

const U = (() => {

  // ── Dates ─────────────────────────────────────────────────
  function fmtDate(d) {
    if (!d) return '—';
    const dt = typeof d === 'string' ? new Date(d) : d;
    return dt.toLocaleDateString('fr-BE', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  function fmtDateTime(d) {
    if (!d) return '—';
    const dt = typeof d === 'string' ? new Date(d) : d;
    return dt.toLocaleDateString('fr-BE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  function today() { return new Date().toISOString().split('T')[0]; }

  function fmtTime(h) {
    const hh = Math.floor(h);
    const mm = Math.round((h - hh) * 60);
    return `${String(hh).padStart(2,'0')}:${String(mm).padStart(2,'0')}`;
  }

  // ── Monnaie ───────────────────────────────────────────────
  function fmtEur(n) {
    return new Intl.NumberFormat('fr-BE', { style: 'currency', currency: 'EUR' }).format(n || 0);
  }

  // ── Initiales ─────────────────────────────────────────────
  function initials(name) {
    if (!name) return '?';
    return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  }

  // ── Toast ─────────────────────────────────────────────────
  function toast(msg, type = 'info') {
    const t = document.createElement('div');
    t.className = `toast toast-${type}`;
    t.innerHTML = `<span>${msg}</span>`;
    document.getElementById('toast-container')?.appendChild(t);
    setTimeout(() => t.classList.add('show'), 10);
    setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 300); }, 3500);
  }

  // ── Modal ─────────────────────────────────────────────────
  function modal(id) { document.getElementById(id)?.classList.add('open'); }
  function closeModal(id) { document.getElementById(id)?.classList.remove('open'); }
  function closeAllModals() { document.querySelectorAll('.modal.open').forEach(m => m.classList.remove('open')); }

  // ── QR Code SVG simple ────────────────────────────────────
  function qrSvg(text, size = 120) {
    // QR code simplifié via API externe (en ligne) ou fallback texte
    return `<img src="https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(text)}&bgcolor=ffffff&color=1a1a2e" width="${size}" height="${size}" alt="QR ${text}" onerror="this.outerHTML='<div class=qr-fallback>${text}</div>'"/>`;
  }

  // ── Impression étiquette ──────────────────────────────────
  function printLabel(product, location) {
    const loc = location ? location.label : '—';
    const w = window.open('', '_blank', 'width=400,height=300');
    w.document.write(`<!DOCTYPE html><html><head><title>Étiquette</title>
    <style>
      body{font-family:Arial,sans-serif;padding:16px;text-align:center;}
      h2{font-size:14px;margin:0 0 4px;}
      .sku{font-size:11px;color:#666;margin-bottom:8px;}
      .loc{font-size:13px;font-weight:bold;background:#1a1a2e;color:#fff;padding:4px 8px;border-radius:4px;display:inline-block;margin-bottom:8px;}
      img{display:block;margin:0 auto;}
      @media print{button{display:none;}}
    </style></head><body>
    <h2>${product.name}</h2>
    <div class="sku">Réf: ${product.sku}</div>
    <div class="loc">${loc}</div>
    ${qrSvg(product.sku, 100)}
    <p style="font-size:11px;margin-top:4px;">${product.sku}</p>
    <button onclick="window.print()" style="margin-top:8px;padding:6px 16px;background:#1a1a2e;color:#fff;border:none;border-radius:4px;cursor:pointer;">Imprimer</button>
    </body></html>`);
    w.document.close();
  }

  // ── Confirmation ──────────────────────────────────────────
  function confirm(msg) { return window.confirm(msg); }

  // ── Couleurs état ─────────────────────────────────────────
  const STATE_COLORS = {
    devis: '#f59e0b', signe: '#3b82f6', en_commande: '#8b5cf6',
    en_cours: '#0ea5e9', facture: '#10b981', sav: '#ef4444',
    draft: '#94a3b8', done: '#10b981', cancelled: '#ef4444',
  };

  const STATE_LABELS = {
    devis: 'Devis', signe: 'Signé', en_commande: 'En commande',
    en_cours: 'En cours', facture: 'Facturé', sav: 'SAV',
    draft: 'Brouillon', in_progress: 'En cours', done: 'Validée',
    invoiced: 'Facturée', cancelled: 'Annulée',
  };

  function stateBadge(state) {
    const color = STATE_COLORS[state] || '#94a3b8';
    const label = STATE_LABELS[state] || state;
    return `<span class="badge" style="background:${color}20;color:${color};border:1px solid ${color}40;">${label}</span>`;
  }

  // ── Équipements ───────────────────────────────────────────
  const EQUIP_LABELS = {
    piscine: '🏊 Piscine', spa: '🛁 Spa', hammam: '💨 Hammam',
    sauna: '🔥 Sauna', multi: '🔧 Multi', universel: '⚙️ Universel',
  };

  const FICHE_LABELS = {
    mis: '🔧 Mise en service', hiv: '❄️ Hivernage',
    sav: '🚨 SAV', int: '⚙️ Intervention',
  };

  return {
    fmtDate, fmtDateTime, today, fmtTime, fmtEur, initials,
    toast, modal, closeModal, closeAllModals,
    qrSvg, printLabel, confirm, stateBadge,
    STATE_COLORS, STATE_LABELS, EQUIP_LABELS, FICHE_LABELS,
  };
})();

window.U = U;
