export const ACADEMY_TUTORS = [
  { id: "eng-tutor", name: "Engineering Study Tutor", domain: "Engineering Education", subjects: ["Mathematics", "Physics", "Chemistry", "Mechanics", "FEA", "CFD", "Nuclear"], color: "#a78bfa" },
  { id: "chemistry-mcp", name: "Computational Chemistry", domain: "Chemistry & Molecular Modeling", subjects: ["Quantum Chemistry", "Molecular Dynamics", "Cheminformatics"], color: "#22c55e" },
  { id: "materials-mcp", name: "Materials Science", domain: "Materials Science", subjects: ["Crystallography", "Phase Diagrams", "Elasticity"], color: "#f59e0b" },
  { id: "fea-mcp", name: "FEA Simulation", domain: "Engineering Simulation", subjects: ["Structural Mechanics", "FEM Theory", "Contact Mechanics"], color: "#ef4444" },
  { id: "nuclear-mcp", name: "Nuclear Engineering", domain: "Nuclear Science", subjects: ["Neutron Transport", "Reactor Physics", "Radiation Shielding"], color: "#06b6d4" },
  { id: "orchestrator-mcp", name: "Pipeline Orchestrator", domain: "Multi-Physics", subjects: ["Pipeline Design", "DAG Scheduling", "Coupling"], color: "#ec4899" },
];

export const ALL_SUBJECTS = [...new Set(ACADEMY_TUTORS.flatMap(t => t.subjects))];

export const TUTOR_BY_ID = Object.fromEntries(ACADEMY_TUTORS.map(t => [t.id, t]));

export const CROSS_POLLINATION_EDGES = [
  { source: "Mechanics", target: "Thermodynamics", strength: 0.85,
    insight: "Both use variational principles — minimum potential energy ↔ minimum free energy. Teach together." },
  { source: "Mechanics", target: "Fluid Mechanics", strength: 0.9,
    insight: "Navier-Stokes is F=ma for fluids. Same Newton's laws, different control volume." },
  { source: "Thermodynamics", target: "Fluid Mechanics", strength: 0.75,
    insight: "Energy equation in fluids IS the first law of thermodynamics." },
  { source: "FEA", target: "CFD", strength: 0.8,
    insight: "Both use FEM/Galerkin methods. Same linear algebra, different physics." },
  { source: "Nuclear Engineering", target: "Thermodynamics", strength: 0.7,
    insight: "Reactors are heat engines with nuclear heat source. Rankine cycle applies." },
  { source: "Nuclear Engineering", target: "Materials Science", strength: 0.85,
    insight: "Radiation damage changes material properties — connects nuclear physics to materials degradation." },
  { source: "Chemistry", target: "Materials Science", strength: 0.9,
    insight: "Bonding → crystal structure → properties. The atomic-to-continuum chain." },
  { source: "Chemistry", target: "Nuclear Engineering", strength: 0.6,
    insight: "Nuclear transmutation changes the nucleus. Chemistry changes electron configuration. Both are 'element transformation'." },
  { source: "FEA", target: "Nuclear Engineering", strength: 0.7,
    insight: "Neutron transport uses finite elements too — SN/PN methods are FEM in phase space." },
  { source: "CFD", target: "Nuclear Engineering", strength: 0.8,
    insight: "Reactor thermal-hydraulics IS CFD with heat generation and two-phase flow." },
  { source: "Computational Chemistry", target: "FEA", strength: 0.65,
    insight: "DFT optimization and FEA both solve K·x=f. Same Newton-Raphson, different physics." },
  { source: "Computational Chemistry", target: "Materials Science", strength: 0.85,
    insight: "DFT predicts material properties from first principles — the ultimate bottom-up approach." },
];

export const OBSERVATIONS = [
  { id: "obs-001", tutor: "eng-tutor", subject: "Mechanics", topic: "Stress",
    observation: "Students confuse engineering stress with true stress, and don't understand why necking changes the calculation.",
    severity: 4, cross_domain_relevance: ["Materials Science", "FEA"] },
  { id: "obs-002", tutor: "eng-tutor", subject: "Thermodynamics", topic: "Entropy",
    observation: "Students memorize S=k·ln(W) but cannot explain WHY entropy increases. They miss the statistical mechanics connection.",
    severity: 5, cross_domain_relevance: ["Chemistry", "Physics"] },
  { id: "obs-003", tutor: "fea-mcp", subject: "FEA", topic: "Mesh Convergence",
    observation: "Students don't understand why mesh refinement near stress concentrations converges slowly. They think finer mesh = always better.",
    severity: 4, cross_domain_relevance: ["Mechanics", "Materials Science"] },
  { id: "obs-004", tutor: "nuclear-mcp", subject: "Nuclear Engineering", topic: "Cross Sections",
    observation: "Students struggle with energy-dependent cross sections — they treat σ as a constant instead of σ(E). Same error as treating stiffness as constant in nonlinear FEA.",
    severity: 3, cross_domain_relevance: ["FEA", "Materials Science"] },
  { id: "obs-005", tutor: "chemistry-mcp", subject: "Computational Chemistry", topic: "Basis Sets",
    observation: "Students pick basis sets arbitrarily without understanding convergence. This is identical to mesh refinement in FEA — same concept, different domain.",
    severity: 4, cross_domain_relevance: ["FEA", "Physics"] },
  { id: "obs-006", tutor: "materials-mcp", subject: "Materials Science", topic: "Phase Diagrams",
    observation: "Students can read phase diagrams but cannot connect them to free energy curves. The Gibbs free energy minimization concept doesn't transfer from thermodynamics.",
    severity: 5, cross_domain_relevance: ["Thermodynamics", "Chemistry"] },
  { id: "obs-007", tutor: "eng-tutor", subject: "Fluid Mechanics", topic: "Turbulence",
    observation: "Students think turbulence is 'random' rather than deterministic chaos. They miss that Navier-Stokes is deterministic — the complexity comes from sensitivity to initial conditions.",
    severity: 3, cross_domain_relevance: ["CFD", "Physics"] },
  { id: "obs-008", tutor: "fea-mcp", subject: "FEA", topic: "Contact Mechanics",
    observation: "Students don't understand why contact is nonlinear — they've only solved linear problems and assume all BCs are simple Dirichlet/Neumann.",
    severity: 4, cross_domain_relevance: ["Mechanics", "Materials Science"] },
];

export const SUBJECT_COLORS = {
  "Mathematics": "#818cf8",
  "Physics": "#a78bfa",
  "Chemistry": "#22c55e",
  "Mechanics": "#f59e0b",
  "FEA": "#ef4444",
  "CFD": "#3b82f6",
  "Nuclear Engineering": "#06b6d4",
  "Thermodynamics": "#ec4899",
  "Fluid Mechanics": "#14b8a6",
  "Materials Science": "#f59e0b",
  "Computational Chemistry": "#22c55e",
  "Quantum Chemistry": "#10b981",
  "Molecular Dynamics": "#34d399",
  "Cheminformatics": "#6ee7b7",
  "Crystallography": "#fbbf24",
  "Phase Diagrams": "#f59e0b",
  "Elasticity": "#d97706",
  "Structural Mechanics": "#f87171",
  "FEM Theory": "#ef4444",
  "Contact Mechanics": "#dc2626",
  "Neutron Transport": "#22d3ee",
  "Reactor Physics": "#06b6d4",
  "Radiation Shielding": "#0891b2",
  "Pipeline Design": "#f472b6",
  "DAG Scheduling": "#ec4899",
  "Coupling": "#db2777",
};

export const SEVERITY_COLORS = { 1: "#22c55e", 2: "#84cc16", 3: "#eab308", 4: "#f97316", 5: "#ef4444" };

export const TUTOR_SUBJECT_MAP = {};
for (const tutor of ACADEMY_TUTORS) {
  for (const subject of tutor.subjects) {
    if (!TUTOR_SUBJECT_MAP[subject]) TUTOR_SUBJECT_MAP[subject] = [];
    TUTOR_SUBJECT_MAP[subject].push(tutor.id);
  }
}

export function dataToGraph() {
  const nodes = [];
  const seen = new Set();

  for (const tutor of ACADEMY_TUTORS) {
    nodes.push({
      id: tutor.id,
      label: tutor.name,
      type: "tutor",
      domain: tutor.domain,
      importance: 30,
      color: tutor.color,
    });
    seen.add(tutor.id);
  }

  for (const edge of CROSS_POLLINATION_EDGES) {
    for (const name of [edge.source, edge.target]) {
      if (!seen.has(name)) {
        nodes.push({
          id: name,
          label: name,
          type: "subject",
          domain: SUBJECT_COLORS[name] ? "Engineering" : "General",
          importance: 20,
          color: SUBJECT_COLORS[name] || "#64748b",
        });
        seen.add(name);
      }
    }
  }

  for (const obs of OBSERVATIONS) {
    if (!seen.has(obs.id)) {
      nodes.push({
        id: obs.id,
        label: obs.topic,
        type: "observation",
        domain: obs.tutor,
        importance: 15,
        color: SEVERITY_COLORS[obs.severity] || "#64748b",
      });
      seen.add(obs.id);
    }
  }

  const edges = [];

  for (const tutor of ACADEMY_TUTORS) {
    for (const subject of tutor.subjects) {
      edges.push({
        source_id: tutor.id,
        target_id: subject,
        strength: 1.0,
        label: "teaches",
        type: "teaches",
      });
    }
  }

  for (const edge of CROSS_POLLINATION_EDGES) {
    edges.push({
      source_id: edge.source,
      target_id: edge.target,
      strength: edge.strength,
      label: edge.insight,
      type: "cross_pollination",
    });
  }

  for (const obs of OBSERVATIONS) {
    edges.push({
      source_id: obs.id,
      target_id: obs.subject,
      strength: 1.0,
      label: "relates to",
      type: "relates_to",
    });
    for (const rel of obs.cross_domain_relevance) {
      const targetId = rel === "CFD" || rel === "FEA" ? rel :
        rel === "Thermodynamics" ? rel :
        rel === "Physics" || rel === "Chemistry" ? rel : rel;
      if (ALL_SUBJECTS.includes(targetId) || CROSS_POLLINATION_EDGES.some(e => e.source === targetId || e.target === targetId)) {
        edges.push({
          source_id: obs.id,
          target_id: targetId,
          strength: 0.5,
          label: "cross-domain relevance",
          type: "cross_relevance",
        });
      }
    }
  }

  return { nodes, edges };
}

export function buildAcademyGraph() {
  const { nodes, edges } = dataToGraph();
  return { nodes, edges };
}

export function getConnectionsForSubject(subjectId) {
  const tutors = ACADEMY_TUTORS.filter(t => t.subjects.includes(subjectId));
  const edges = CROSS_POLLINATION_EDGES.filter(e => e.source === subjectId || e.target === subjectId);
  const observations = OBSERVATIONS.filter(o => o.subject === subjectId || o.cross_domain_relevance.includes(subjectId));
  const relatedSubjects = new Set();
  for (const e of edges) {
    relatedSubjects.add(e.source === subjectId ? e.target : e.source);
  }
  return {
    subject: subjectId,
    tutors: tutors.map(t => ({ id: t.id, name: t.name, color: t.color })),
    crossPollinations: edges,
    relatedSubjects: [...relatedSubjects],
    observations: observations.map(o => ({ id: o.id, topic: o.topic, observation: o.observation, severity: o.severity })),
  };
}

export function getCrossPollinationStats() {
  const totalEdges = CROSS_POLLINATION_EDGES.length;
  const avgStrength = CROSS_POLLINATION_EDGES.reduce((s, e) => s + e.strength, 0) / totalEdges;
  const byDomain = {};
  for (const edge of CROSS_POLLINATION_EDGES) {
    const key = `${edge.source} ↔ ${edge.target}`;
    byDomain[key] = { strength: edge.strength, insight: edge.insight };
  }
  const strongest = [...CROSS_POLLINATION_EDGES].sort((a, b) => b.strength - a.strength).slice(0, 3);
  const weakest = [...CROSS_POLLINATION_EDGES].sort((a, b) => a.strength - b.strength).slice(0, 3);
  return {
    totalConnections: totalEdges,
    averageStrength: Math.round(avgStrength * 100) / 100,
    strongestLinks: strongest,
    weakestLinks: weakest,
    subjectCount: ALL_SUBJECTS.length,
    tutorCount: ACADEMY_TUTORS.length,
    observationCount: OBSERVATIONS.length,
  };
}

export function simulateCrossPollination(sourceSubject, targetSubject) {
  const directEdge = CROSS_POLLINATION_EDGES.find(e =>
    (e.source === sourceSubject && e.target === targetSubject) ||
    (e.source === targetSubject && e.target === sourceSubject)
  );
  if (directEdge) {
    return {
      found: true,
      strength: directEdge.strength,
      insight: directEdge.insight,
      path: [sourceSubject, targetSubject],
      sharedTutors: ACADEMY_TUTORS.filter(t =>
        t.subjects.includes(sourceSubject) && t.subjects.includes(targetSubject)
      ),
      connectingObservations: OBSERVATIONS.filter(o =>
        o.subject === sourceSubject && o.cross_domain_relevance.includes(targetSubject)
      ),
    };
  }
  const bridge = CROSS_POLLINATION_EDGES.find(e =>
    e.source === sourceSubject || e.target === sourceSubject
  );
  if (bridge) {
    const via = bridge.source === sourceSubject ? bridge.target : bridge.source;
    const second = CROSS_POLLINATION_EDGES.find(e =>
      (e.source === via && e.target === targetSubject) ||
      (e.target === via && e.source === targetSubject)
    );
    if (second) {
      return {
        found: true,
        strength: Math.round((bridge.strength + second.strength) / 2 * 100) / 100,
        insight: `Connected via ${via}: "${bridge.insight}" → "${second.insight}"`,
        path: [sourceSubject, via, targetSubject],
        sharedTutors: [],
        connectingObservations: [],
      };
    }
  }
  return {
    found: false,
    strength: 0,
    insight: `No direct connection found between ${sourceSubject} and ${targetSubject}.`,
    path: [sourceSubject, targetSubject],
    sharedTutors: [],
    connectingObservations: [],
  };
}

export function getObservationById(id) {
  return OBSERVATIONS.find(o => o.id === id) || null;
}

export function getObservationsBySeverity(minSeverity) {
  return OBSERVATIONS.filter(o => o.severity >= minSeverity)
    .sort((a, b) => b.severity - a.severity);
}

export function getCrossDomainLinks(subjectA, subjectB) {
  const edges = CROSS_POLLINATION_EDGES.filter(e =>
    (e.source === subjectA && e.target === subjectB) ||
    (e.source === subjectB && e.target === subjectA)
  );
  const observations = OBSERVATIONS.filter(o =>
    (o.subject === subjectA && o.cross_domain_relevance.includes(subjectB)) ||
    (o.subject === subjectB && o.cross_domain_relevance.includes(subjectA))
  );
  const sharedTutors = ACADEMY_TUTORS.filter(t =>
    t.subjects.includes(subjectA) && t.subjects.includes(subjectB)
  );
  return {
    subjectA,
    subjectB,
    crossPollinationEdges: edges,
    observations,
    sharedTutors,
    hasDirectConnection: edges.length > 0,
  };
}
