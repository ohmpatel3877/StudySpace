import React, { useRef, useEffect } from 'react';
import { renderAcademyGraph, type AcademyGraph } from '../graph/academy-graph.js';
import { buildAcademyGraph } from '../graph/academy-data.js';

interface KnowledgeGraphProps {
  width?: number | string;
  height?: number | string;
}

const KnowledgeGraph: React.FC<KnowledgeGraphProps> = ({ width = '100%', height = '100%' }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const graphRef = useRef<AcademyGraph | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const data = buildAcademyGraph();
    const graph = renderAcademyGraph(container, data);
    graphRef.current = graph;

    const handleResize = () => {
      if (graphRef.current) {
        (graphRef.current as any)._resize();
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (graphRef.current) {
        graphRef.current.destroy();
        graphRef.current = null;
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      style={{ width, height, position: 'relative', overflow: 'hidden' }}
      data-testid="knowledge-graph"
    />
  );
};

export default KnowledgeGraph;
