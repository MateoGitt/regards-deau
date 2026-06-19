// ═══════════════════════════════════════════════════════════
// COUCHE BASE DE DONNÉES
// Firebase en production, localStorage en mode démo
// ═══════════════════════════════════════════════════════════

const DB = (() => {
  // ── Données initiales démo ────────────────────────────────
  const DEMO_DATA = {
    users: [
      { id: 'u1', name: 'Administrateur', email: 'admin@regards-eau.be', password: 'admin123', role: 'admin', color: '#6366f1', active: true },
      { id: 'u2', name: 'Marc Dumont', email: 'patron@regards-eau.be', password: 'patron123', role: 'patron', color: '#0ea5e9', active: true },
      { id: 'u3', name: 'Sophie Lambert', email: 'commercial@regards-eau.be', password: 'comm123', role: 'commercial', color: '#f59e0b', active: true },
      { id: 'u4', name: 'Thomas Renard', email: 'tech1@regards-eau.be', password: 'tech123', role: 'technicien', color: '#10b981', active: true },
      { id: 'u5', name: 'Kevin Pire', email: 'tech2@regards-eau.be', password: 'tech123', role: 'technicien', color: '#ef4444', active: true },
    ],
    clients: [
      { id: 'c1', name: 'Jean-Pierre Martin', phone: '0475 12 34 56', email: 'jp.martin@gmail.com', street: 'Rue des Lilas 12', zip: '4000', city: 'Liège', equipment_type: 'piscine', basin_type: 'liner', basin_volume: 45, pump_model: 'Hayward Super Pump 1.5cv', water_treatment: 'sel', other_equipment: 'Robot Zodiac CX30, volet immergé', technical_notes: 'Accès par portail latéral gauche. Code: 1234', created_at: '2024-01-15' },
      { id: 'c2', name: 'Famille Dubois', phone: '0498 65 43 21', email: 'dubois.family@outlook.com', street: 'Avenue du Parc 8', zip: '1300', city: 'Wavre', equipment_type: 'spa', basin_type: null, basin_volume: 8, pump_model: 'Balboa VS500', water_treatment: 'brome', other_equipment: 'Couverture thermique', technical_notes: 'Spa sur terrasse couverte. Électricien: 0470 11 22 33', created_at: '2024-02-20' },
      { id: 'c3', name: 'Restaurant Le Bleu', phone: '04 222 33 44', email: 'contact@lebleu.be', street: 'Chaussée de Namur 55', zip: '5000', city: 'Namur', equipment_type: 'hammam', basin_type: null, basin_volume: null, pump_model: null, water_treatment: null, other_equipment: 'Générateur vapeur 9kW, bancs en teck', technical_notes: 'Contrat entretien annuel. Responsable: Ahmed 0477 55 66 77', created_at: '2024-03-10' },
    ],
    products: [
      { id: 'p1', sku: 'AQ-PMP-001', name: 'Pompe Hayward Super Pump 1.5cv', category: 'equipement', unit: 'pce', qty: 3, qty_min: 1, price_buy: 285, price_sell: 420, location_id: 'l1', equipment_type: 'piscine', brand: 'Hayward', ref_fab: 'SP2607X10', barcode: '3701234567890' },
      { id: 'p2', sku: 'AQ-PMP-002', name: 'Pompe Zodiac TRI Expert 1cv', category: 'equipement', unit: 'pce', qty: 2, qty_min: 1, price_buy: 195, price_sell: 295, location_id: 'l2', equipment_type: 'piscine', brand: 'Zodiac', ref_fab: 'W70143', barcode: '3701234567891' },
      { id: 'p3', sku: 'AQ-CHM-001', name: 'Chlore choc granulés 5kg', category: 'traitement', unit: 'sac', qty: 24, qty_min: 5, price_buy: 18, price_sell: 32, location_id: 'l5', equipment_type: 'universel', brand: 'AstralPool', ref_fab: 'CHO-5KG', barcode: '3701234567892' },
      { id: 'p4', sku: 'AQ-CHM-002', name: 'Algicide hiver 5L', category: 'traitement', unit: 'bidon', qty: 12, qty_min: 3, price_buy: 22, price_sell: 38, location_id: 'l5', equipment_type: 'universel', brand: 'AstralPool', ref_fab: 'ALG-HIV-5L', barcode: '3701234567893' },
      { id: 'p5', sku: 'AQ-FLT-001', name: 'Filtre à sable Astral Cantabric D400', category: 'equipement', unit: 'pce', qty: 1, qty_min: 1, price_buy: 165, price_sell: 245, location_id: 'l3', equipment_type: 'piscine', brand: 'AstralPool', ref_fab: 'CANT-400', barcode: '3701234567894' },
      { id: 'p6', sku: 'AQ-CHM-003', name: 'Sel pour électrolyseur 25kg', category: 'traitement', unit: 'sac', qty: 18, qty_min: 4, price_buy: 8, price_sell: 14, location_id: 'l6', equipment_type: 'piscine', brand: 'Générique', ref_fab: 'SEL-25KG', barcode: '3701234567895' },
      { id: 'p7', sku: 'AQ-ACC-001', name: 'Bouchon skimmer standard', category: 'pieces', unit: 'pce', qty: 20, qty_min: 8, price_buy: 2.5, price_sell: 5, location_id: 'l4', equipment_type: 'piscine', brand: 'Générique', ref_fab: 'BSK-STD', barcode: '3701234567896' },
      { id: 'p8', sku: 'AQ-SPA-001', name: 'Brome en comprimés 1kg', category: 'traitement', unit: 'boite', qty: 8, qty_min: 3, price_buy: 28, price_sell: 45, location_id: 'l7', equipment_type: 'spa', brand: 'Bayrol', ref_fab: 'BRO-1KG', barcode: '3701234567897' },
    ],
    locations: [
      { id: 'l1', zone: 'A', row: '1', shelf: '1', label: 'A-1-1', description: 'Pompes électriques' },
      { id: 'l2', zone: 'A', row: '1', shelf: '2', label: 'A-1-2', description: 'Pompes électriques' },
      { id: 'l3', zone: 'A', row: '2', shelf: '1', label: 'A-2-1', description: 'Filtres' },
      { id: 'l4', zone: 'B', row: '1', shelf: '1', label: 'B-1-1', description: 'Accessoires petites pièces' },
      { id: 'l5', zone: 'C', row: '1', shelf: '1', label: 'C-1-1', description: 'Produits chimiques piscine' },
      { id: 'l6', zone: 'C', row: '1', shelf: '2', label: 'C-1-2', description: 'Sel et minéraux' },
      { id: 'l7', zone: 'C', row: '2', shelf: '1', label: 'C-2-1', description: 'Produits chimiques spa' },
    ],
    stock_moves: [
      { id: 'sm1', product_id: 'p1', type: 'in', qty: 3, date: '2024-05-10', user_id: 'u2', reason: 'Achat fournisseur', ref: 'BL-2024-001' },
      { id: 'sm2', product_id: 'p3', type: 'out', qty: 2, date: '2024-05-15', user_id: 'u4', reason: 'Intervention INT/2024/0001', ref: 'INT/2024/0001' },
    ],
    chantiers: [
      { id: 'ch1', name: 'Piscine béton Martin', client_id: 'c1', type: 'construction', state: 'en_cours', date_start: '2024-04-01', date_end_planned: '2024-07-01', amount_ht: 28500, commercial_id: 'u3', technicians: ['u4'], description: 'Piscine béton 8x4m, liner, local technique', odoo_ref: null, created_at: '2024-03-20' },
      { id: 'ch2', name: 'SAV Pompe Dubois', client_id: 'c2', type: 'sav', state: 'devis', date_start: '2024-05-20', date_end_planned: '2024-05-20', amount_ht: 350, commercial_id: 'u3', technicians: ['u5'], description: 'Remplacement pompe spa défectueuse', odoo_ref: null, created_at: '2024-05-18' },
    ],
    fiches: [
      { id: 'f1', reference: 'INT/2024/0001', type: 'int', state: 'done', client_id: 'c1', chantier_id: 'ch1', technician_id: 'u4', date: '2024-05-15', time_start: 8.5, time_end: 12.0, km: 35, description: 'Contrôle filtration et traitement eau', work_done: 'Nettoyage filtre, ajout chlore choc, réglage débit', created_at: '2024-05-15' },
    ],
    planning: [
      { id: 'pl1', title: 'Chantier Martin - Coffrage', chantier_id: 'ch1', client_id: 'c1', technician_ids: ['u4'], date: new Date().toISOString().split('T')[0], time_start: 8, time_end: 17, color: '#10b981', materials: ['Ciment 25kg x4', 'Armature acier'], notes: 'Apporter niveau laser' },
    ],
  };

  // ── Initialisation démo ───────────────────────────────────
  function initDemo() {
    if (!localStorage.getItem('regards-eau_initialized')) {
      Object.entries(DEMO_DATA).forEach(([key, val]) => {
        localStorage.setItem(`regards-eau_${key}`, JSON.stringify(val));
      });
      localStorage.setItem('regards-eau_initialized', '1');
      console.log('[Regards d'eau] Données démo initialisées');
    }
  }

  // ── CRUD localStorage ─────────────────────────────────────
  function getAll(collection) {
    try {
      return JSON.parse(localStorage.getItem(`regards-eau_${collection}`)) || [];
    } catch { return []; }
  }

  function getById(collection, id) {
    return getAll(collection).find(i => i.id === id) || null;
  }

  function save(collection, item) {
    const all = getAll(collection);
    const idx = all.findIndex(i => i.id === item.id);
    if (idx >= 0) all[idx] = item;
    else all.push(item);
    localStorage.setItem(`regards-eau_${collection}`, JSON.stringify(all));
    return item;
  }

  function remove(collection, id) {
    const all = getAll(collection).filter(i => i.id !== id);
    localStorage.setItem(`regards-eau_${collection}`, JSON.stringify(all));
  }

  function genId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  // ── API publique ──────────────────────────────────────────
  return { initDemo, getAll, getById, save, remove, genId, DEMO_DATA };
})();

window.DB = DB;
