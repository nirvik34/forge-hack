import React, { useState, useCallback } from 'react';
import ReactFlow, { Background, Controls, MiniMap } from 'reactflow';
import 'reactflow/dist/style.css';

// Mock data for the DAG
const initialNodes = [
  { id: '1', data: { label: 'Commit a1b2c3 (Verified)' }, position: { x: 250, y: 50 }, style: { background: '#10B981', color: 'white', border: '1px solid #059669', borderRadius: '8px', padding: '10px' } },
  { id: '2', data: { label: 'Commit f9e8d7 (Verified)' }, position: { x: 250, y: 150 }, style: { background: '#10B981', color: 'white', border: '1px solid #059669', borderRadius: '8px', padding: '10px' } },
  { id: '3', data: { label: 'Commit 4c5b6a (Flagged)' }, position: { x: 250, y: 250 }, style: { background: '#EF4444', color: 'white', border: '1px solid #DC2626', borderRadius: '8px', padding: '10px' } },
  { id: '4', data: { label: 'Branch: alternative_hypothesis' }, position: { x: 450, y: 150 }, style: { background: '#3B82F6', color: 'white', border: '1px solid #2563EB', borderRadius: '8px', padding: '10px' } },
];

const initialEdges = [
  { id: 'e1-2', source: '1', target: '2', animated: true },
  { id: 'e2-3', source: '2', target: '3', animated: true, style: { stroke: '#EF4444' } },
  { id: 'e1-4', source: '1', target: '4', animated: true },
];

function MemoryTree({ onNodeClick }) {
  const [nodes, setNodes] = useState(initialNodes);
  const [edges, setEdges] = useState(initialEdges);

  const onNodeClickInternal = useCallback((event, node) => {
    // In a real app, we'd fetch the commit data here
    onNodeClick({
      hash: node.id,
      label: node.data.label,
      payload: {
        thought: "I should analyze the data using pandas.",
        action: "python_repl",
        observation: "Data loaded successfully."
      },
      status: node.id === '3' ? 'flagged' : 'verified'
    });
  }, [onNodeClick]);

  return (
    <div className="w-full h-full">
      <ReactFlow 
        nodes={nodes} 
        edges={edges}
        onNodeClick={onNodeClickInternal}
        fitView
      >
        <Background color="#ccc" gap={16} />
        <Controls />
        <MiniMap />
      </ReactFlow>
    </div>
  );
}

export default MemoryTree;
