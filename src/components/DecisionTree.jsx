import React, { useState, useEffect, useRef } from 'react';
import { Tree } from 'react-d3-tree';

// Custom node component for the decision tree
const CustomNode = ({ nodeData, onNodeClick }) => {
  // Calculate color based on emotional state (red to green)
  const getNodeColor = () => {
    const emotionalState = nodeData.data.emotionalState || 0.5;
    const r = Math.floor(255 * (1 - emotionalState));
    const g = Math.floor(255 * emotionalState);
    return `rgb(${r}, ${g}, 0)`;
  };

  // Calculate node size based on visit count
  const getNodeSize = () => {
    const baseSize = 30;
    const visits = nodeData.data.visits || 0;
    return baseSize + Math.min(visits * 3, 40);
  };

  const nodeSize = getNodeSize();
  const nodeColor = getNodeColor();
  const nodeBorder = nodeData.data.selected ? '#0af' : '#333';
  const nodeBorderWidth = nodeData.data.selected ? 4 : 1;

  return (
    <g onClick={() => onNodeClick(nodeData)}>
      <circle r={nodeSize} fill={nodeColor} stroke={nodeBorder} strokeWidth={nodeBorderWidth} />
      <text
        className="text-sm font-medium text-white"
        textAnchor="middle"
        dy=".3em"
        style={{ pointerEvents: 'none' }}
      >
        {nodeData.data.id}
      </text>
    </g>
  );
};

const DecisionTree = ({ 
  treeData, 
  onNodeSelect, 
  selectedNodeId = null,
  width = 800,
  height = 600
}) => {
  const [translate, setTranslate] = useState({ x: width / 2, y: height / 4 });
  const [dimensions, setDimensions] = useState({ width, height });
  const treeContainer = useRef(null);

  // Process tree data to match react-d3-tree format
  const processTreeData = (node) => {
    // Extract node data
    const processedNode = {
      name: node.id,
      data: {
        ...node,
        selected: node.id === selectedNodeId
      },
      children: node.children?.map(child => processTreeData(child)) || []
    };
    
    return processedNode;
  };

  // Prepare data for visualization
  const processedData = treeData ? processTreeData(treeData) : { name: 'root', children: [] };

  // Update dimensions when container size changes
  useEffect(() => {
    if (treeContainer.current) {
      const { width, height } = treeContainer.current.getBoundingClientRect();
      setDimensions({ width, height });
      setTranslate({ x: width / 2, y: height / 6 });
    }
  }, [width, height]);

  // Handle node click
  const handleNodeClick = (nodeData) => {
    if (onNodeSelect) {
      onNodeSelect(nodeData.data);
    }
  };

  return (
    <div className="relative overflow-hidden bg-gray-100 rounded-lg border border-gray-300 flex-1" 
         ref={treeContainer} 
         style={{ width: '100%', height: '100%', minHeight: '400px' }}>
      <Tree
        data={processedData}
        translate={translate}
        orientation="vertical"
        pathFunc="step"
        separation={{ siblings: 1, nonSiblings: 1.5 }}
        nodeSize={{ x: 120, y: 120 }}
        renderCustomNodeElement={(rd3tProps) => 
          <CustomNode {...rd3tProps} onNodeClick={handleNodeClick} />
        }
        zoomable={true}
      />
      
      <div className="absolute bottom-4 left-4 bg-white p-2 rounded-md shadow-md">
        <div className="flex items-center mb-1">
          <div className="w-4 h-4 bg-red-600 rounded-full mr-2"></div>
          <span className="text-xs">Low Confidence</span>
        </div>
        <div className="flex items-center mb-1">
          <div className="w-4 h-4 bg-yellow-500 rounded-full mr-2"></div>
          <span className="text-xs">Neutral</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-green-600 rounded-full mr-2"></div>
          <span className="text-xs">High Confidence</span>
        </div>
      </div>
    </div>
  );
};

export default DecisionTree;