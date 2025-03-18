import React from 'react';

const NodeDetails = ({ node, onExploreAlternative, simulationRunning }) => {
  if (!node) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-lg font-semibold mb-4">Node Details</h2>
        <p className="text-gray-500">Select a node to view details</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Node Details</h2>
        <button 
          onClick={onExploreAlternative}
          className="px-4 py-1 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition"
          disabled={simulationRunning}
        >
          Explore Alternative
        </button>
      </div>
      
      <div className="space-y-4">
        <div>
          <h3 className="text-md font-medium text-gray-700">Content</h3>
          <div className="mt-1 p-3 bg-gray-50 rounded-md">
            <p className="text-sm">{node.content}</p>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h3 className="text-md font-medium text-gray-700">Statistics</h3>
            <div className="mt-1 space-y-1">
              <p className="text-sm">ID: <span className="font-mono">{node.id}</span></p>
              <p className="text-sm">Visits: <span className="font-semibold">{node.visits}</span></p>
              <p className="text-sm">Value: <span className="font-semibold">{node.value?.toFixed(2) || 0}</span></p>
              <p className="text-sm">Depth: <span className="font-semibold">{node.depth || 0}</span></p>
            </div>
          </div>
          
          <div>
            <h3 className="text-md font-medium text-gray-700">Metrics</h3>
            <div className="mt-1 space-y-1">
              <div className="flex items-center">
                <span className="text-sm w-32">Emotional State:</span>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-600 h-2 rounded-full" 
                    style={{ width: `${(node.emotionalState || 0.5) * 100}%` }}
                  ></div>
                </div>
              </div>
              <div className="flex items-center">
                <span className="text-sm w-32">Instinct Weight:</span>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full" 
                    style={{ width: `${(node.instinctWeight || 0.5) * 100}%` }}
                  ></div>
                </div>
              </div>
              <div className="flex items-center">
                <span className="text-sm w-32">Perseverance:</span>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-purple-600 h-2 rounded-full" 
                    style={{ width: `${(node.perseverance || 0.5) * 100}%` }}
                  ></div>
                </div>
              </div>
              <div className="flex items-center">
                <span className="text-sm w-32">Confidence:</span>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-yellow-500 h-2 rounded-full" 
                    style={{ width: `${(node.confidence || 0.5) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NodeDetails;