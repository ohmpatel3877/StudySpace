/**
 * AcademyGraph — Obsidian-style force-directed knowledge graph
 * for the Tutor Academy cross-pollination system.
 *
 * Pure vanilla JS, zero dependencies. Builds a spring-electric
 * physics simulation from scratch and renders to a <canvas>
 * element with interactive node dragging, zoom/pan, click
 * highlighting, and particle effects for cross-pollination.
 *
 * Usage:
 *   import { renderAcademyGraph } from './academy-graph.js';
 *   const graph = renderAcademyGraph(containerElement, data);
 *   graph.start();
 *
 *   // On cross-pollinate event:
 *   graph.pulseConnection(sourceId, targetId);
 */

// ═════════════════════════════════════════════════════════════
//   MATH HELPERS
// ═════════════════════════════════════════════════════════════

function dist(x1, y1, x2, y2) {
  const dx = x2 - x1, dy = y2 - y1;
  return Math.sqrt(dx * dx + dy * dy);
}

function clamp(v, lo, hi) {
  return v < lo ? lo : v > hi ? hi : v;
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function randomRange(lo, hi) {
  return lo + Math.random() * (hi - lo);
}

// ═════════════════════════════════════════════════════════════
//   COLOR HELPERS
// ═════════════════════════════════════════════════════════════

function hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function parseHex(hex) {
  return [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16)
  ];
}

function hexToCSS(hex, alpha) {
  const [r, g, b] = parseHex(hex);
  return `rgba(${r},${g},${b},${alpha})`;
}

// ═════════════════════════════════════════════════════════════
//   NODE-TYPE CONFIG
// ═════════════════════════════════════════════════════════════

const NODE_CONFIG = {
  tutor:       { radius: 26, color: '#7c5cfc', labelSize: 12, labelWeight: '700' },
  subject:     { radius: 20, color: '#4a9cc7', labelSize: 11, labelWeight: '600' },
  topic:       { radius: 14, color: '#22c55e', labelSize: 10, labelWeight: '500' },
  observation: { radius: 11, color: '#eab308', labelSize: 9,  labelWeight: '400' },
};

// ═════════════════════════════════════════════════════════════
//   DEFAULT DATASET — Tutor Academy Cross-Pollination Network
// ═════════════════════════════════════════════════════════════

const DEFAULT_ACADEMY_DATA = {
  nodes: [
    { id: 'tutor-eng',          label: 'Engineering Tutor',     type: 'tutor',   domain: 'General Engineering',        importance: 1.0, color: '#7c5cfc' },
    { id: 'tutor-chem',         label: 'Chemistry MCP',         type: 'tutor',   domain: 'Computational Chemistry',     importance: 0.9, color: '#7c5cfc' },
    { id: 'tutor-materials',    label: 'Materials MCP',         type: 'tutor',   domain: 'Materials Science',           importance: 0.9, color: '#7c5cfc' },
    { id: 'tutor-fea',          label: 'FEA MCP',               type: 'tutor',   domain: 'Finite Element Analysis',     importance: 0.8, color: '#7c5cfc' },
    { id: 'tutor-nuclear',      label: 'Nuclear MCP',           type: 'tutor',   domain: 'Nuclear Engineering',         importance: 0.8, color: '#7c5cfc' },
    { id: 'tutor-orchestrator', label: 'Orchestrator MCP',       type: 'tutor',   domain: 'Multi-Physics Integration',   importance: 1.0, color: '#7c5cfc' },

    { id: 'sub-math',           label: 'Mathematics',            type: 'subject', domain: 'STEM',                       importance: 0.9, color: '#4a9cc7' },
    { id: 'sub-physics',        label: 'Physics',                type: 'subject', domain: 'Physical Sciences',           importance: 0.9, color: '#4a9cc7' },
    { id: 'sub-chemistry',      label: 'Chemistry',              type: 'subject', domain: 'Physical Sciences',           importance: 0.8, color: '#4a9cc7' },
    { id: 'sub-mechanics',      label: 'Mechanics',              type: 'subject', domain: 'Solid Mechanics',            importance: 0.8, color: '#4a9cc7' },
    { id: 'sub-thermo',         label: 'Thermodynamics',         type: 'subject', domain: 'Thermal Sciences',           importance: 0.8, color: '#4a9cc7' },
    { id: 'sub-fluids',         label: 'Fluid Mechanics',        type: 'subject', domain: 'Fluid Dynamics',             importance: 0.7, color: '#4a9cc7' },
    { id: 'sub-materials',      label: 'Materials Science',      type: 'subject', domain: 'Material Engineering',       importance: 0.8, color: '#4a9cc7' },
    { id: 'sub-fea',            label: 'FEA',                    type: 'subject', domain: 'Computational Mechanics',    importance: 0.7, color: '#4a9cc7' },
    { id: 'sub-cfd',            label: 'CFD',                    type: 'subject', domain: 'Computational Physics',      importance: 0.7, color: '#4a9cc7' },
    { id: 'sub-nuclear',        label: 'Nuclear Engineering',    type: 'subject', domain: 'Nuclear Sciences',           importance: 0.8, color: '#4a9cc7' },
    { id: 'sub-comp-chem',      label: 'Computational Chemistry',type: 'subject', domain: 'Cheminformatics',            importance: 0.7, color: '#4a9cc7' },
    { id: 'sub-multiphysics',   label: 'Multi-Physics',          type: 'subject', domain: 'Cross-Domain Modeling',      importance: 0.9, color: '#4a9cc7' },

    { id: 'topic-stress',       label: 'Stress',                 type: 'topic',   domain: 'Solid Mechanics',            importance: 0.6, color: '#22c55e' },
    { id: 'topic-energy',       label: 'Energy',                 type: 'topic',   domain: 'Physical Phenomena',         importance: 0.6, color: '#22c55e' },
    { id: 'topic-equilibrium',  label: 'Equilibrium',            type: 'topic',   domain: 'Physical Phenomena',         importance: 0.5, color: '#22c55e' },
    { id: 'topic-phase',        label: 'Phase Transitions',      type: 'topic',   domain: 'Materials Chemistry',        importance: 0.5, color: '#22c55e' },
    { id: 'topic-radiation',    label: 'Radiation Damage',       type: 'topic',   domain: 'Nuclear Materials',          importance: 0.4, color: '#22c55e' },
    { id: 'topic-turbulence',   label: 'Turbulence',             type: 'topic',   domain: 'Fluid Dynamics',             importance: 0.5, color: '#22c55e' },
    { id: 'topic-mesh',         label: 'Mesh Generation',        type: 'topic',   domain: 'Computational Geometry',     importance: 0.5, color: '#22c55e' },
    { id: 'topic-cross-section',label: 'Cross Sections',         type: 'topic',   domain: 'Nuclear Physics',            importance: 0.4, color: '#22c55e' },

    { id: 'obs-stress-confusion',  label: 'Stress tensor confusion',    type: 'observation', domain: 'Students rotate stress tensors incorrectly',     importance: 0.3, color: '#eab308' },
    { id: 'obs-energy-transfer',   label: 'Energy transfer gaps',      type: 'observation', domain: 'First Law sign convention errors',              importance: 0.3, color: '#eab308' },
    { id: 'obs-phase-misconcept',  label: 'Phase equilibrium conflated',type: 'observation', domain: 'Phase ≠ chemical equilibrium',                importance: 0.3, color: '#eab308' },
    { id: 'obs-mesh-quality',      label: 'Mesh quality blind spot',   type: 'observation', domain: 'Convergence studies skipped',                     importance: 0.3, color: '#eab308' },
    { id: 'obs-radiation-damage',  label: 'Radiation cascade intuition',type: 'observation', domain: 'PKA → cascade → defect visualisation missing',   importance: 0.3, color: '#eab308' },
    { id: 'obs-turbulence-model',  label: 'Turbulence model confusion', type: 'observation', domain: 'RANS vs LES vs DNS trade-offs unclear',          importance: 0.3, color: '#eab308' },
  ],

  edges: [
    { source_id: 'tutor-eng',          target_id: 'sub-math',         strength: 0.9, label: 'teaches',        type: 'teaches' },
    { source_id: 'tutor-eng',          target_id: 'sub-physics',      strength: 0.8, label: 'teaches',        type: 'teaches' },
    { source_id: 'tutor-eng',          target_id: 'sub-mechanics',    strength: 1.0, label: 'specializes',    type: 'teaches' },
    { source_id: 'tutor-chem',         target_id: 'sub-chemistry',    strength: 1.0, label: 'specializes',    type: 'teaches' },
    { source_id: 'tutor-chem',         target_id: 'sub-comp-chem',    strength: 0.9, label: 'expert',         type: 'teaches' },
    { source_id: 'tutor-materials',    target_id: 'sub-materials',    strength: 1.0, label: 'specializes',    type: 'teaches' },
    { source_id: 'tutor-materials',    target_id: 'sub-thermo',       strength: 0.6, label: 'teaches',        type: 'teaches' },
    { source_id: 'tutor-materials',    target_id: 'sub-mechanics',    strength: 0.7, label: 'teaches',        type: 'teaches' },
    { source_id: 'tutor-fea',          target_id: 'sub-fea',          strength: 1.0, label: 'specializes',    type: 'teaches' },
    { source_id: 'tutor-fea',          target_id: 'sub-mechanics',    strength: 0.8, label: 'teaches',        type: 'teaches' },
    { source_id: 'tutor-fea',          target_id: 'sub-multiphysics', strength: 0.7, label: 'cross-applies',  type: 'teaches' },
    { source_id: 'tutor-nuclear',      target_id: 'sub-nuclear',      strength: 1.0, label: 'specializes',    type: 'teaches' },
    { source_id: 'tutor-nuclear',      target_id: 'sub-thermo',       strength: 0.7, label: 'teaches',        type: 'teaches' },
    { source_id: 'tutor-nuclear',      target_id: 'sub-materials',    strength: 0.6, label: 'teaches',        type: 'teaches' },
    { source_id: 'tutor-orchestrator', target_id: 'sub-multiphysics', strength: 1.0, label: 'specializes',    type: 'teaches' },
    { source_id: 'tutor-orchestrator', target_id: 'sub-math',         strength: 0.7, label: 'teaches',        type: 'teaches' },
    { source_id: 'tutor-orchestrator', target_id: 'sub-physics',      strength: 0.7, label: 'teaches',        type: 'teaches' },
    { source_id: 'tutor-orchestrator', target_id: 'sub-fea',          strength: 0.6, label: 'guides',         type: 'teaches' },
    { source_id: 'tutor-orchestrator', target_id: 'sub-cfd',          strength: 0.6, label: 'guides',         type: 'teaches' },

    { source_id: 'sub-mechanics',      target_id: 'topic-stress',     strength: 1.0, label: 'covers',         type: 'covers' },
    { source_id: 'sub-physics',        target_id: 'topic-energy',     strength: 0.9, label: 'covers',         type: 'covers' },
    { source_id: 'sub-thermo',         target_id: 'topic-energy',     strength: 0.8, label: 'covers',         type: 'covers' },
    { source_id: 'sub-chemistry',      target_id: 'topic-equilibrium',strength: 0.9, label: 'covers',         type: 'covers' },
    { source_id: 'sub-thermo',         target_id: 'topic-equilibrium',strength: 0.7, label: 'covers',         type: 'covers' },
    { source_id: 'sub-materials',      target_id: 'topic-phase',      strength: 0.9, label: 'covers',         type: 'covers' },
    { source_id: 'sub-chemistry',      target_id: 'topic-phase',      strength: 0.8, label: 'covers',         type: 'covers' },
    { source_id: 'sub-nuclear',        target_id: 'topic-radiation',  strength: 1.0, label: 'covers',         type: 'covers' },
    { source_id: 'sub-materials',      target_id: 'topic-radiation',  strength: 0.7, label: 'covers',         type: 'covers' },
    { source_id: 'sub-fluids',         target_id: 'topic-turbulence', strength: 1.0, label: 'covers',         type: 'covers' },
    { source_id: 'sub-cfd',            target_id: 'topic-turbulence', strength: 0.9, label: 'covers',         type: 'covers' },
    { source_id: 'sub-fea',            target_id: 'topic-mesh',       strength: 1.0, label: 'covers',         type: 'covers' },
    { source_id: 'sub-cfd',            target_id: 'topic-mesh',       strength: 0.8, label: 'covers',         type: 'covers' },
    { source_id: 'sub-nuclear',        target_id: 'topic-cross-section',strength:1.0,label: 'covers',         type: 'covers' },
    { source_id: 'sub-physics',        target_id: 'topic-cross-section',strength:0.6,label: 'covers',         type: 'covers' },

    { source_id: 'sub-mechanics',      target_id: 'sub-materials',    strength: 0.8, label: 'cross-pollinates', type: 'cross' },
    { source_id: 'sub-fea',            target_id: 'sub-cfd',          strength: 0.7, label: 'cross-pollinates', type: 'cross' },
    { source_id: 'sub-thermo',         target_id: 'sub-fluids',       strength: 0.6, label: 'cross-pollinates', type: 'cross' },
    { source_id: 'sub-chemistry',      target_id: 'sub-materials',    strength: 0.7, label: 'cross-pollinates', type: 'cross' },
    { source_id: 'sub-nuclear',        target_id: 'sub-thermo',       strength: 0.6, label: 'cross-pollinates', type: 'cross' },
    { source_id: 'sub-math',           target_id: 'sub-physics',      strength: 0.9, label: 'cross-pollinates', type: 'cross' },
    { source_id: 'sub-physics',        target_id: 'sub-mechanics',    strength: 0.8, label: 'cross-pollinates', type: 'cross' },
    { source_id: 'sub-chemistry',      target_id: 'sub-comp-chem',    strength: 0.9, label: 'cross-pollinates', type: 'cross' },
    { source_id: 'sub-multiphysics',   target_id: 'sub-fea',          strength: 0.7, label: 'cross-pollinates', type: 'cross' },
    { source_id: 'sub-multiphysics',   target_id: 'sub-cfd',          strength: 0.7, label: 'cross-pollinates', type: 'cross' },
    { source_id: 'sub-multiphysics',   target_id: 'sub-nuclear',      strength: 0.5, label: 'cross-pollinates', type: 'cross' },

    { source_id: 'obs-stress-confusion',  target_id: 'sub-mechanics', strength: 0.9, label: 'indicates',    type: 'observes' },
    { source_id: 'obs-energy-transfer',   target_id: 'sub-thermo',    strength: 0.8, label: 'indicates',    type: 'observes' },
    { source_id: 'obs-energy-transfer',   target_id: 'sub-physics',   strength: 0.5, label: 'indicates',    type: 'observes' },
    { source_id: 'obs-phase-misconcept',  target_id: 'sub-chemistry', strength: 0.7, label: 'indicates',    type: 'observes' },
    { source_id: 'obs-phase-misconcept',  target_id: 'sub-materials', strength: 0.6, label: 'indicates',    type: 'observes' },
    { source_id: 'obs-mesh-quality',      target_id: 'sub-fea',       strength: 0.9, label: 'indicates',    type: 'observes' },
    { source_id: 'obs-mesh-quality',      target_id: 'sub-cfd',       strength: 0.5, label: 'indicates',    type: 'observes' },
    { source_id: 'obs-radiation-damage',  target_id: 'sub-nuclear',   strength: 0.9, label: 'indicates',    type: 'observes' },
    { source_id: 'obs-radiation-damage',  target_id: 'sub-materials', strength: 0.6, label: 'indicates',    type: 'observes' },
    { source_id: 'obs-turbulence-model',  target_id: 'sub-fluids',    strength: 0.8, label: 'indicates',    type: 'observes' },
    { source_id: 'obs-turbulence-model',  target_id: 'sub-cfd',       strength: 0.7, label: 'indicates',    type: 'observes' },
  ]
};

// ═════════════════════════════════════════════════════════════
//   AcademyGraph CLASS
// ═════════════════════════════════════════════════════════════

class AcademyGraph {
  /**
   * @param {string|HTMLElement} container — CSS selector or element
   * @param {Object} data — { nodes: [...], edges: [...] }
   */
  constructor(container, data) {
    this.container = typeof container === 'string'
      ? document.getElementById(container) || document.querySelector(container)
      : container;

    if (!this.container) throw new Error('AcademyGraph: container not found');

    this._rawData = data || { nodes: [], edges: [] };
    this.nodes = [];
    this.edges = [];
    this._nodeMap = {};
    this._edgeMap = {};

    this._running = false;
    this._frameId = null;
    this._warmupFrames = 200;
    this._warmupDone = false;
    this._frameCount = 0;
    this._timeStep = 0.35;
    this._damping = 0.85;
    this._repulsionStrength = 8000;
    this._attractionStrength = 0.012;
    this._gravityStrength = 0.005;
    this._restLength = 120;
    this._minDist = 5;
    this._maxVelocity = 8;

    this._camera = { x: 0, y: 0, zoom: 1.0 };
    this._targetZoom = 1.0;
    this._zoomMin = 0.15;
    this._zoomMax = 4.0;

    this._dragNode = null;
    this._dragOffsetX = 0;
    this._dragOffsetY = 0;
    this._isDragging = false;
    this._isPanning = false;
    this._panStartX = 0;
    this._panStartY = 0;
    this._panCamStartX = 0;
    this._panCamStartY = 0;
    this._hoveredNode = null;
    this._selectedNode = null;
    this._mouseX = 0;
    this._mouseY = 0;

    this._highlightedId = null;
    this._highlightNeighbors = new Set();
    this._dimNodes = false;

    this._particles = [];

    this._infoPanel = null;

    this._clickCallbacks = [];
    this._hoverCallbacks = [];
    this._dragCallbacks = [];

    this._dpr = Math.min(window.devicePixelRatio || 1, 2);

    this._buildGraph();
    this._createCanvas();
    this._createInfoPanel();
    this._bindEvents();
    this._resize();

    this._initPositions();
    this._warmupSimulation();
  }

  // ── Public API ─────────────────────────────────────────

  start() {
    if (this._running) return;
    this._running = true;
    this._tick();
  }

  stop() {
    this._running = false;
    if (this._frameId) {
      cancelAnimationFrame(this._frameId);
      this._frameId = null;
    }
  }

  zoomIn() {
    this._targetZoom = clamp(this._targetZoom * 1.25, this._zoomMin, this._zoomMax);
  }

  zoomOut() {
    this._targetZoom = clamp(this._targetZoom / 1.25, this._zoomMin, this._zoomMax);
  }

  resetView() {
    this._targetZoom = 1.0;
    this._camera.x = 0;
    this._camera.y = 0;
  }

  fitToScreen() {
    if (!this.nodes.length || !this._canvas) return;
    const pad = 80;
    const w = this._canvas.clientWidth - pad * 2;
    const h = this._canvas.clientHeight - pad * 2;
    if (w <= 0 || h <= 0) return;

    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;
    for (const n of this.nodes) {
      if (n.x < minX) minX = n.x;
      if (n.x > maxX) maxX = n.x;
      if (n.y < minY) minY = n.y;
      if (n.y > maxY) maxY = n.y;
    }
    const extW = maxX - minX || 1;
    const extH = maxY - minY || 1;
    const zoomX = w / extW;
    const zoomY = h / extH;
    this._targetZoom = clamp(Math.min(zoomX, zoomY), this._zoomMin, this._zoomMax);
    this._camera.x = -(minX + extW / 2) * this._targetZoom + this._canvas.clientWidth / 2;
    this._camera.y = -(minY + extH / 2) * this._targetZoom + this._canvas.clientHeight / 2;
  }

  highlightNode(id) {
    this._highlightedId = id;
    this._dimNodes = true;
    this._highlightNeighbors = new Set();
    if (id && this._nodeMap[id]) {
      for (const e of this.edges) {
        if (e.source === id || e.target === id) {
          this._highlightNeighbors.add(e.source);
          this._highlightNeighbors.add(e.target);
        }
      }
    }
  }

  clearHighlight() {
    this._highlightedId = null;
    this._highlightNeighbors = new Set();
    this._dimNodes = false;
    this._selectedNode = null;
  }

  addNode(node) {
    if (this._nodeMap[node.id]) return;
    const n = this._initNode(node);
    this.nodes.push(n);
    this._nodeMap[n.id] = n;
    for (const e of this._rawData.edges) {
      if ((e.source_id === n.id || e.target_id === n.id) && !this._edgeMap[e.source_id + '-' + e.target_id]) {
        const edge = {
          id: e.source_id + '-' + e.target_id,
          source: e.source_id,
          target: e.target_id,
          strength: e.strength || 0.5,
          label: e.label || '',
          type: e.type || 'connects',
          _sourceNode: this._nodeMap[e.source_id],
          _targetNode: this._nodeMap[e.target_id],
        };
        this.edges.push(edge);
        this._edgeMap[edge.id] = edge;
      }
    }
  }

  addEdge(edge) {
    const id = edge.source_id + '-' + edge.target_id;
    if (this._edgeMap[id]) return;
    const e = {
      id: id,
      source: edge.source_id,
      target: edge.target_id,
      strength: edge.strength || 0.5,
      label: edge.label || '',
      type: edge.type || 'connects',
      _sourceNode: this._nodeMap[edge.source_id],
      _targetNode: this._nodeMap[edge.target_id],
    };
    this.edges.push(e);
    this._edgeMap[id] = e;
    this._rawData.edges.push(edge);
  }

  removeNode(id) {
    const idx = this.nodes.findIndex(n => n.id === id);
    if (idx === -1) return;
    this.nodes.splice(idx, 1);
    delete this._nodeMap[id];
    this.edges = this.edges.filter(e => {
      if (e.source === id || e.target === id) {
        delete this._edgeMap[e.id];
        return false;
      }
      return true;
    });
    this._rawData.nodes = this._rawData.nodes.filter(n => n.id !== id);
    this._rawData.edges = this._rawData.edges.filter(e => e.source_id !== id && e.target_id !== id);
  }

  pulseConnection(sourceId, targetId, count) {
    const edgeId = sourceId + '-' + targetId;
    const edge = this._edgeMap[edgeId];
    if (!edge) return;
    const burst = count || 8;
    const srcNode = this._nodeMap[sourceId];
    const tgtNode = this._nodeMap[targetId];
    if (!srcNode || !tgtNode) return;
    for (let i = 0; i < burst; i++) {
      this._particles.push({
        edge: edge,
        progress: Math.random() * 0.3,
        speed: 0.008 + Math.random() * 0.012,
        size: 2 + Math.random() * 3,
        alpha: 0.8 + Math.random() * 0.2,
        color: edge.strength > 0.7 ? '#a78bfa' : '#6bb8e0',
        life: 1.0,
        decay: 0.003 + Math.random() * 0.005,
        srcNode: srcNode,
        tgtNode: tgtNode,
      });
    }
  }

  getNodePosition(id) {
    const n = this._nodeMap[id];
    if (!n) return null;
    return { x: n.x, y: n.y };
  }

  exportData() {
    const nodes = this.nodes.map(n => ({
      id: n.id,
      label: n.label,
      type: n.type,
      domain: n.domain,
      importance: n.importance,
      x: n.x,
      y: n.y,
      pinned: n.pinned || false,
      color: n.color,
    }));
    const edges = this.edges.map(e => ({
      source_id: e.source,
      target_id: e.target,
      strength: e.strength,
      label: e.label,
      type: e.type,
    }));
    return { nodes, edges };
  }

  onNodeClick(callback) {
    this._clickCallbacks.push(callback);
  }

  onNodeHover(callback) {
    this._hoverCallbacks.push(callback);
  }

  onNodeDrag(callback) {
    this._dragCallbacks.push(callback);
  }

  // ── Internal: Graph Build ────────────────────────────

  _initNode(raw) {
    const cfg = NODE_CONFIG[raw.type] || NODE_CONFIG.topic;
    return {
      id: raw.id,
      label: raw.label,
      type: raw.type || 'topic',
      domain: raw.domain || '',
      importance: raw.importance || 0.5,
      color: raw.color || cfg.color,
      radius: raw.radius || (cfg.radius * (0.8 + (raw.importance || 0.5) * 0.4)),
      radiusTarget: raw.radius || (cfg.radius * (0.8 + (raw.importance || 0.5) * 0.4)),
      x: raw.x || 0,
      y: raw.y || 0,
      vx: 0,
      vy: 0,
      pinned: raw.pinned || false,
      glowIntensity: 0,
    };
  }

  _buildGraph() {
    this.nodes = [];
    this.edges = [];
    this._nodeMap = {};
    this._edgeMap = {};

    for (const raw of this._rawData.nodes) {
      const n = this._initNode(raw);
      this.nodes.push(n);
      this._nodeMap[n.id] = n;
    }

    for (const raw of this._rawData.edges) {
      const src = this._nodeMap[raw.source_id];
      const tgt = this._nodeMap[raw.target_id];
      if (!src || !tgt) continue;
      const e = {
        id: raw.source_id + '-' + raw.target_id,
        source: raw.source_id,
        target: raw.target_id,
        strength: raw.strength || 0.5,
        label: raw.label || '',
        type: raw.type || 'connects',
        _sourceNode: src,
        _targetNode: tgt,
      };
      this.edges.push(e);
      this._edgeMap[e.id] = e;
    }
  }

  _initPositions() {
    const cx = 0, cy = 0;
    const spread = Math.max(this.nodes.length, 10) * 60;
    const angleStep = (2 * Math.PI) / this.nodes.length;
    let i = 0;
    for (const n of this.nodes) {
      if (n.pinned) continue;
      if (n.x === 0 && n.y === 0) {
        const angle = i * angleStep + randomRange(-0.3, 0.3);
        const radius = spread * (0.5 + Math.random() * 1.0);
        n.x = cx + Math.cos(angle) * radius;
        n.y = cy + Math.sin(angle) * radius;
      }
      n.vx = 0;
      n.vy = 0;
      i++;
    }
  }

  // ── Simulation ───────────────────────────────────────

  _physicsTick() {
    const repK = this._repulsionStrength;
    const attK = this._attractionStrength;
    const gravK = this._gravityStrength;
    const rest = this._restLength;
    const minD = this._minDist;
    const maxV = this._maxVelocity;
    const dt = this._timeStep;
    const n = this.nodes.length;

    for (const node of this.nodes) {
      node.fx = 0;
      node.fy = 0;
    }

    for (let i = 0; i < n; i++) {
      const a = this.nodes[i];
      if (a.pinned) continue;
      for (let j = i + 1; j < n; j++) {
        const b = this.nodes[j];
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const d = Math.sqrt(dx * dx + dy * dy);
        const dClamped = Math.max(d, minD);
        const force = repK / (dClamped * dClamped);
        const fx = (force * dx) / dClamped;
        const fy = (force * dy) / dClamped;
        a.fx += fx;
        a.fy += fy;
        b.fx -= fx;
        b.fy -= fy;
      }
    }

    for (const edge of this.edges) {
      const a = edge._sourceNode;
      const b = edge._targetNode;
      if (!a || !b) continue;
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const d = Math.sqrt(dx * dx + dy * dy);
      const dClamped = Math.max(d, minD);
      const displacement = dClamped - rest;
      const force = attK * edge.strength * displacement;
      const fx = (force * dx) / dClamped;
      const fy = (force * dy) / dClamped;
      if (!a.pinned) { a.fx += fx; a.fy += fy; }
      if (!b.pinned) { b.fx -= fx; b.fy -= fy; }
    }

    for (const node of this.nodes) {
      if (node.pinned) continue;
      node.fx -= gravK * node.x;
      node.fy -= gravK * node.y;
    }

    const damping = this._damping;
    for (const node of this.nodes) {
      if (node.pinned) continue;
      node.vx = (node.vx + node.fx * dt) * damping;
      node.vy = (node.vy + node.fy * dt) * damping;
      const speed = Math.sqrt(node.vx * node.vx + node.vy * node.vy);
      if (speed > maxV) {
        node.vx = (node.vx / speed) * maxV;
        node.vy = (node.vy / speed) * maxV;
      }
      node.x += node.vx * dt;
      node.y += node.vy * dt;
    }

    this._updateParticles();
  }

  _warmupSimulation() {
    const oldDt = this._timeStep;
    this._timeStep = 0.6;
    const oldDamp = this._damping;
    this._damping = 0.7;
    for (let i = 0; i < this._warmupFrames; i++) {
      this._physicsTick();
    }
    this._timeStep = oldDt;
    this._damping = oldDamp;
    this._warmupDone = true;
    this._frameCount = 0;
  }

  _updateParticles() {
    for (let i = this._particles.length - 1; i >= 0; i--) {
      const p = this._particles[i];
      p.progress += p.speed;
      p.life -= p.decay;
      if (p.progress >= 1.0 || p.life <= 0) {
        this._particles.splice(i, 1);
        continue;
      }
    }
  }

  // ── Rendering ────────────────────────────────────────

  _createCanvas() {
    const canvas = document.createElement('canvas');
    canvas.style.cssText = 'display:block;width:100%;height:100%;cursor:grab;touch-action:none';
    this._canvas = canvas;
    this._ctx = canvas.getContext('2d');
    this.container.appendChild(canvas);
  }

  _resize() {
    const rect = this.container.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;
    const dpr = this._dpr;
    this._canvas.width = w * dpr;
    this._canvas.height = h * dpr;
    this._canvas.style.width = w + 'px';
    this._canvas.style.height = h + 'px';
    this._ctx.setTransform(1, 0, 0, 1, 0, 0);
    this._ctx.scale(dpr, dpr);
    this._width = w;
    this._height = h;
  }

  _worldToScreen(wx, wy) {
    return {
      x: wx * this._camera.zoom + this._camera.x,
      y: wy * this._camera.zoom + this._camera.y,
    };
  }

  _screenToWorld(sx, sy) {
    return {
      x: (sx - this._camera.x) / this._camera.zoom,
      y: (sy - this._camera.y) / this._camera.zoom,
    };
  }

  _render() {
    const ctx = this._ctx;
    const w = this._width;
    const h = this._height;
    const cam = this._camera;

    cam.zoom = lerp(cam.zoom, this._targetZoom, 0.1);
    if (Math.abs(cam.zoom - this._targetZoom) < 0.001) cam.zoom = this._targetZoom;

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(this._dpr, this._dpr);

    ctx.fillStyle = '#0f0f13';
    ctx.fillRect(0, 0, w, h);

    ctx.save();
    ctx.translate(cam.x, cam.y);
    ctx.scale(cam.zoom, cam.zoom);

    const isDimmed = this._dimNodes && this._highlightedId;
    const hlId = this._highlightedId;
    const hlSet = this._highlightNeighbors;

    for (const edge of this.edges) {
      const a = edge._sourceNode;
      const b = edge._targetNode;
      if (!a || !b) continue;

      let alpha = edge.strength * 0.35;

      if (isDimmed) {
        if (a.id === hlId || b.id === hlId) {
          alpha = edge.strength * 0.9;
        } else if (hlSet.has(a.id) && hlSet.has(b.id)) {
          alpha = edge.strength * 0.7;
        } else {
          alpha = edge.strength * 0.08;
        }
      }

      if (this._hoveredNode) {
        if (a.id === this._hoveredNode.id || b.id === this._hoveredNode.id) {
          alpha = Math.max(alpha, edge.strength * 0.85);
        }
      }

      if (alpha < 0.01) continue;

      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);

      if (edge.strength > 0.7 && alpha > 0.3) {
        ctx.shadowColor = edge.strength > 0.85 ? '#a78bfa' : '#6bb8e0';
        ctx.shadowBlur = 6 * edge.strength * alpha;
      }

      ctx.strokeStyle = edge.type === 'cross'
        ? `rgba(167,139,250,${alpha})`
        : `rgba(160,160,180,${alpha})`;

      ctx.lineWidth = 1.2 + edge.strength * 2.0;
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    for (const p of this._particles) {
      const src = p.srcNode;
      const tgt = p.tgtNode;
      if (!src || !tgt) continue;
      const t = p.progress;
      const px = lerp(src.x, tgt.x, t);
      const py = lerp(src.y, tgt.y, t);

      ctx.beginPath();
      ctx.arc(px, py, p.size * cam.zoom, 0, Math.PI * 2);
      ctx.fillStyle = hexToCSS(p.color, p.life * p.alpha);
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 8 * p.life;
      ctx.fill();
    }
    ctx.shadowBlur = 0;

    for (const node of this.nodes) {
      const cfg = NODE_CONFIG[node.type] || NODE_CONFIG.topic;
      const r = node.radius;
      let alpha = 1.0;

      if (isDimmed) {
        alpha = (node.id === hlId || hlSet.has(node.id)) ? 1.0 : 0.15;
      }

      const isHovered = this._hoveredNode && this._hoveredNode.id === node.id;
      const glow = isHovered ? 20 : (node.glowIntensity > 0.01 ? node.glowIntensity * 8 : 0);

      ctx.beginPath();
      ctx.arc(node.x, node.y, r, 0, Math.PI * 2);

      if (glow > 0.5) {
        ctx.shadowColor = node.color;
        ctx.shadowBlur = glow;
      }

      const grad = ctx.createRadialGradient(
        node.x - r * 0.3, node.y - r * 0.3, r * 0.1,
        node.x, node.y, r
      );
      grad.addColorStop(0, hexToCSS(node.color, Math.min(1, alpha + 0.2)));
      grad.addColorStop(1, hexToCSS(node.color, alpha * 0.85));
      ctx.fillStyle = grad;
      ctx.fill();

      ctx.shadowBlur = 0;

      ctx.strokeStyle = hexToCSS(node.color, Math.min(1, alpha + 0.15));
      ctx.lineWidth = isHovered ? 2 : 1;
      ctx.stroke();

      if (cam.zoom > 0.3) {
        const fontSize = (cfg.labelSize || 10) * Math.min(1, cam.zoom * 0.7);
        const labelAlpha = clamp((cam.zoom - 0.25) / 0.6, 0, 1) * alpha;
        if (labelAlpha > 0.1) {
          ctx.font = `${cfg.labelWeight || '500'} ${fontSize}px 'Segoe UI', system-ui, sans-serif`;
          ctx.textAlign = 'center';
          ctx.fillStyle = `rgba(226,226,239,${labelAlpha})`;
          ctx.fillText(node.label, node.x, node.y + r + fontSize + 4);

          if (cam.zoom > 0.6 && node.domain) {
            ctx.font = `${fontSize * 0.65}px 'Segoe UI', system-ui, sans-serif`;
            ctx.fillStyle = `rgba(136,136,170,${labelAlpha * 0.6})`;
            ctx.fillText(node.domain, node.x, node.y + r + fontSize * 2.2 + 6);
          }
        }
      }
    }

    ctx.restore();

    if (cam.zoom > 0.2) {
      const legendY = h - 12;
      let lx = 16;
      const legendItems = [
        { label: 'Tutor', color: '#7c5cfc' },
        { label: 'Subject', color: '#4a9cc7' },
        { label: 'Topic', color: '#22c55e' },
        { label: 'Observation', color: '#eab308' },
      ];
      ctx.font = '10px sans-serif';
      for (const item of legendItems) {
        ctx.fillStyle = item.color;
        ctx.beginPath();
        ctx.arc(lx + 4, legendY - 3, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#8888aa';
        ctx.textAlign = 'left';
        ctx.fillText(item.label, lx + 12, legendY);
        lx += ctx.measureText(item.label).width + 28;
      }
    }
  }

  // ── Animation Loop ───────────────────────────────────

  _tick() {
    if (!this._running) return;

    this._physicsTick();

    if (this._frameCount % 2 === 0) {
      this._render();
    }
    this._frameCount++;

    this._frameId = requestAnimationFrame(() => this._tick());
  }

  // ── Info Panel ───────────────────────────────────────

  _createInfoPanel() {
    const panel = document.createElement('div');
    panel.style.cssText =
      'position:fixed;background:#1a1a24;border:1px solid #2a2a40;border-radius:12px;' +
      'padding:16px;color:#e2e2ef;font-size:13px;z-index:9999;display:none;' +
      'min-width:200px;max-width:320px;box-shadow:0 8px 32px rgba(0,0,0,0.6);' +
      'pointer-events:none;font-family:\'Segoe UI\',system-ui,sans-serif;';
    this._infoPanel = panel;
    document.body.appendChild(panel);
  }

  _showInfoPanel(node, screenX, screenY) {
    const p = this._infoPanel;
    if (!p) return;
    const [r, g, b] = parseHex(node.color);
    const nEdges = this.edges.filter(e => e.source === node.id || e.target === node.id).length;
    p.innerHTML = `
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px">
        <div style="width:14px;height:14px;border-radius:50%;background:${node.color};flex-shrink:0"></div>
        <div style="font-weight:700;font-size:14px;color:#e2e2ef">${node.label}</div>
      </div>
      <div style="color:#8888aa;font-size:11px;margin-bottom:6px;">
        <span style="color:${node.color};font-weight:600">${node.type.charAt(0).toUpperCase() + node.type.slice(1)}</span>
        ${node.domain ? ' · ' + node.domain : ''}
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:11px;color:#8888aa">
        <div><span style="color:#a78bfa;font-weight:600">Connections</span><br>${nEdges}</div>
        <div><span style="color:#a78bfa;font-weight:600">Importance</span><br>${(node.importance * 100).toFixed(0)}%</div>
      </div>
      ${node.domain ? `<div style="margin-top:8px;padding-top:8px;border-top:1px solid #2a2a40;font-size:10px;color:#666">${node.domain}</div>` : ''}
    `;
    p.style.display = 'block';
    let px = screenX + 16;
    let py = screenY - 10;
    if (px + 320 > window.innerWidth) px = screenX - 330;
    if (py + 200 > window.innerHeight) py = window.innerHeight - 210;
    if (py < 10) py = 10;
    p.style.left = px + 'px';
    p.style.top = py + 'px';
  }

  _hideInfoPanel() {
    if (this._infoPanel) this._infoPanel.style.display = 'none';
  }

  // ── Hit Testing ─────────────────────────────────────

  _hitTest(sx, sy) {
    const world = this._screenToWorld(sx, sy);
    let closest = null;
    let closestDist = 20 / this._camera.zoom;
    for (const node of this.nodes) {
      const d = dist(world.x, world.y, node.x, node.y);
      const threshold = Math.max(node.radius + 4, closestDist);
      if (d < threshold) {
        closest = node;
        closestDist = d;
      }
    }
    return closest;
  }

  // ── Event Binding ────────────────────────────────────

  _bindEvents() {
    const c = this._canvas;

    c.addEventListener('mousedown', (e) => this._onMouseDown(e));
    window.addEventListener('mousemove', (e) => this._onMouseMove(e));
    window.addEventListener('mouseup', (e) => this._onMouseUp(e));
    c.addEventListener('wheel', (e) => this._onWheel(e), { passive: false });
    c.addEventListener('contextmenu', (e) => { e.preventDefault(); });

    c.addEventListener('touchstart', (e) => this._onTouchStart(e), { passive: false });
    c.addEventListener('touchmove', (e) => this._onTouchMove(e), { passive: false });
    c.addEventListener('touchend', (e) => this._onTouchEnd(e));

    window.addEventListener('resize', () => this._resize());

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.clearHighlight();
        this._hideInfoPanel();
        this._selectedNode = null;
      }
    });

    c.addEventListener('mouseenter', () => { this._mouseInCanvas = true; });
    c.addEventListener('mouseleave', () => {
      this._mouseInCanvas = false;
      if (this._hoveredNode) {
        this._hoveredNode = null;
        this._canvas.style.cursor = 'grab';
        for (const cb of this._hoverCallbacks) cb(null);
      }
      this._hideInfoPanel();
    });
  }

  _onMouseDown(e) {
    const rect = this._canvas.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;

    if (e.button === 2) {
      const node = this._hitTest(sx, sy);
      if (node) {
        this._showInfoPanel(node, e.clientX, e.clientY);
        this._selectedNode = node;
        this.highlightNode(node.id);
      }
      return;
    }

    const hit = this._hitTest(sx, sy);
    if (hit) {
      this._dragNode = hit;
      const world = this._screenToWorld(sx, sy);
      this._dragOffsetX = hit.x - world.x;
      this._dragOffsetY = hit.y - world.y;
      this._isDragging = false;
      this._canvas.style.cursor = 'grabbing';
      hit._wasPinned = hit.pinned;
      hit.pinned = true;
    } else {
      this._isPanning = true;
      this._panStartX = sx;
      this._panStartY = sy;
      this._panCamStartX = this._camera.x;
      this._panCamStartY = this._camera.y;
      this._canvas.style.cursor = 'grabbing';
    }
  }

  _onMouseMove(e) {
    const rect = this._canvas.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;
    this._mouseX = sx;
    this._mouseY = sy;

    if (this._dragNode) {
      this._isDragging = true;
      const world = this._screenToWorld(sx, sy);
      this._dragNode.x = world.x + this._dragOffsetX;
      this._dragNode.y = world.y + this._dragOffsetY;
      this._dragNode.vx = 0;
      this._dragNode.vy = 0;
      return;
    }

    if (this._isPanning) {
      this._camera.x = this._panCamStartX + (sx - this._panStartX);
      this._camera.y = this._panCamStartY + (sy - this._panStartY);
      return;
    }

    const hit = this._hitTest(sx, sy);
    if (hit !== this._hoveredNode) {
      this._hoveredNode = hit;
      this._canvas.style.cursor = hit ? 'pointer' : 'grab';
      for (const cb of this._hoverCallbacks) cb(hit ? hit.id : null);
    }

    for (const n of this.nodes) {
      n.glowIntensity = lerp(n.glowIntensity, (n === hit ? 1.0 : 0), 0.15);
    }
  }

  _onMouseUp(e) {
    if (this._dragNode) {
      if (!this._dragNode._doublePinned) {
        this._dragNode.pinned = this._dragNode._wasPinned || false;
      }
      delete this._dragNode._wasPinned;

      if (this._isDragging) {
        for (const cb of this._dragCallbacks) cb(this._dragNode.id, { x: this._dragNode.x, y: this._dragNode.y });
      }

      if (!this._isDragging) {
        const now = Date.now();
        if (this._lastClickTime && (now - this._lastClickTime) < 400 && this._lastClickId === this._dragNode.id) {
          this._dragNode.pinned = !this._dragNode.pinned;
          this._dragNode._doublePinned = this._dragNode.pinned;
          this._dragNode.vx = 0;
          this._dragNode.vy = 0;
        } else {
          for (const cb of this._clickCallbacks) cb(this._dragNode.id);
          this._selectedNode = this._selectedNode === this._dragNode ? null : this._dragNode;
          if (this._selectedNode) {
            this.highlightNode(this._selectedNode.id);
          } else {
            this.clearHighlight();
          }
        }
        this._lastClickTime = now;
        this._lastClickId = this._dragNode.id;
      }

      this._dragNode = null;
      this._isDragging = false;
      this._canvas.style.cursor = 'grab';
    }

    if (this._isPanning) {
      this._isPanning = false;
      this._canvas.style.cursor = 'grab';
    }
  }

  _onWheel(e) {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 1 / 1.08 : 1.08;
    this._targetZoom = clamp(this._targetZoom * delta, this._zoomMin, this._zoomMax);

    const rect = this._canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const world = this._screenToWorld(mx, my);
    const newZoom = clamp(this._targetZoom, this._zoomMin, this._zoomMax);
    this._camera.x = mx - world.x * newZoom;
    this._camera.y = my - world.y * newZoom;
  }

  // ── Touch Support ────────────────────────────────────

  _onTouchStart(e) {
    e.preventDefault();
    if (e.touches.length === 1) {
      const t = e.touches[0];
      const rect = this._canvas.getBoundingClientRect();
      const sx = t.clientX - rect.left;
      const sy = t.clientY - rect.top;
      this._longPressTimer = setTimeout(() => {
        const node = this._hitTest(sx, sy);
        if (node) {
          this._showInfoPanel(node, t.clientX, t.clientY);
          this._selectedNode = node;
          this.highlightNode(node.id);
        }
      }, 600);

      const hit = this._hitTest(sx, sy);
      if (hit) {
        this._dragNode = hit;
        const world = this._screenToWorld(sx, sy);
        this._dragOffsetX = hit.x - world.x;
        this._dragOffsetY = hit.y - world.y;
        this._isDragging = false;
        hit._wasPinned = hit.pinned;
        hit.pinned = true;
        this._touchStartId = hit.id;
      } else {
        this._touchStartId = null;
        this._isPanning = true;
        this._panStartX = sx;
        this._panStartY = sy;
        this._panCamStartX = this._camera.x;
        this._panCamStartY = this._camera.y;
      }
      this._touchStartX = sx;
      this._touchStartY = sy;
      this._touchMoved = false;
    } else if (e.touches.length === 2) {
      const t1 = e.touches[0], t2 = e.touches[1];
      this._pinchDist = dist(t1.clientX, t1.clientY, t2.clientX, t2.clientY);
      this._pinchZoom = this._targetZoom;
      this._pinchCenter = {
        x: (t1.clientX + t2.clientX) / 2,
        y: (t1.clientY + t2.clientY) / 2,
      };
    }
  }

  _onTouchMove(e) {
    e.preventDefault();
    clearTimeout(this._longPressTimer);
    this._touchMoved = true;

    if (e.touches.length === 1) {
      const t = e.touches[0];
      const rect = this._canvas.getBoundingClientRect();
      const sx = t.clientX - rect.left;
      const sy = t.clientY - rect.top;

      if (this._dragNode) {
        this._isDragging = true;
        const world = this._screenToWorld(sx, sy);
        this._dragNode.x = world.x + this._dragOffsetX;
        this._dragNode.y = world.y + this._dragOffsetY;
        this._dragNode.vx = 0;
        this._dragNode.vy = 0;
      } else if (this._isPanning) {
        this._camera.x = this._panCamStartX + (sx - this._panStartX);
        this._camera.y = this._panCamStartY + (sy - this._panStartY);
      }
    } else if (e.touches.length === 2) {
      const t1 = e.touches[0], t2 = e.touches[1];
      const newDist = dist(t1.clientX, t1.clientY, t2.clientX, t2.clientY);
      const scale = newDist / this._pinchDist;
      this._targetZoom = clamp(this._pinchZoom * scale, this._zoomMin, this._zoomMax);
    }
  }

  _onTouchEnd(e) {
    clearTimeout(this._longPressTimer);

    if (!this._touchMoved && this._dragNode && !this._isDragging) {
      const now = Date.now();
      if (this._lastTapTime && (now - this._lastTapTime) < 400 && this._lastTapId === this._dragNode.id) {
        this._dragNode.pinned = !this._dragNode.pinned;
        this._dragNode._doublePinned = this._dragNode.pinned;
      } else {
        for (const cb of this._clickCallbacks) cb(this._dragNode.id);
        this._selectedNode = this._selectedNode === this._dragNode ? null : this._dragNode;
        if (this._selectedNode) this.highlightNode(this._selectedNode.id);
        else this.clearHighlight();
      }
      this._lastTapTime = now;
      this._lastTapId = this._dragNode.id;
    }

    if (this._dragNode) {
      if (!this._dragNode._doublePinned) {
        this._dragNode.pinned = this._dragNode._wasPinned || false;
      }
      delete this._dragNode._wasPinned;
      if (this._isDragging) {
        for (const cb of this._dragCallbacks) cb(this._dragNode.id, { x: this._dragNode.x, y: this._dragNode.y });
      }
      this._dragNode = null;
      this._isDragging = false;
    }
    this._isPanning = false;
  }

  // ── Cleanup ──────────────────────────────────────────

  destroy() {
    this.stop();
    this._hideInfoPanel();
    if (this._infoPanel && this._infoPanel.parentNode) {
      this._infoPanel.parentNode.removeChild(this._infoPanel);
    }
    if (this._canvas && this._canvas.parentNode) {
      this._canvas.parentNode.removeChild(this._canvas);
    }
    window.removeEventListener('resize', this._resize);
  }
}

// ═════════════════════════════════════════════════════════════
//   FACTORY FUNCTION
// ═════════════════════════════════════════════════════════════

/**
 * Render an AcademyGraph into a container element.
 *
 * @param {HTMLElement} containerElement — DOM element to mount into
 * @param {Object} data — { nodes: [...], edges: [...] }
 * @returns {AcademyGraph} — control object with the full API
 */
export function renderAcademyGraph(containerElement, data) {
  if (!containerElement) throw new Error('renderAcademyGraph: containerElement is required');

  const graphData = data || DEFAULT_ACADEMY_DATA;

  let wrapper = containerElement;
  if (containerElement.tagName !== 'DIV' && containerElement.tagName !== 'CANVAS') {
    wrapper = document.createElement('div');
    wrapper.style.cssText = 'width:100%;height:100%;position:relative;overflow:hidden';
    containerElement.appendChild(wrapper);
  }

  const graph = new AcademyGraph(wrapper, graphData);
  graph.start();
  return graph;
}

export { AcademyGraph, DEFAULT_ACADEMY_DATA };
