/**
 * Utility functions for tree manipulation and visualization
 */

/**
 * Convert a node tree to Mermaid diagram format
 * @param {Object} root - Root node of the tree
 * @param {string} selectedNodeId - ID of the selected node (if any)
 * @returns {string} Mermaid diagram code
 */
export function generateMermaidDiagram(root, selectedNodeId = null) {
  if (!root) {
    return "```mermaid\ngraph TD\n    A[No tree initialized yet]\n```";
  }
  
  // Escape special characters in strings for Mermaid
  const escape = (str) => {
    if (typeof str !== 'string') return '';
    return str.replace(/"/g, '&quot;')
              .replace(/\(/g, '&#40;')
              .replace(/\)/g, '&#41;');
  };
  
  // Convert node to Mermaid format
  const nodeToMermaid = (node, depth = 0) => {
    const indent = "    ".repeat(depth);
    
    // Calculate color based on emotional state (red to green)
    const r = Math.floor(255 * (1 - (node.emotionalState || 0.5)));
    const g = Math.floor(255 * (node.emotionalState || 0.5));
    const nodeColor = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}00`;
    
    // Node content preview (limited to 20 chars)
    const contentPreview = escape(
      (node.content || '').substring(0, 20) + ((node.content || '').length > 20 ? '...' : '')
    );
    
    // Node declaration
    let lines = [
      `${indent}${node.id}["${node.id}: ${node.visits || 0} - ${contentPreview}"]`,
      `${indent}style ${node.id} fill:${nodeColor}`
    ];
    
    // Highlight selected node
    if (selectedNodeId && node.id === selectedNodeId) {
      lines.push(`${indent}style ${node.id} stroke:#0af,stroke-width:4px`);
    }
    
    // Add children and connections
    if (node.children && node.children.length > 0) {
      for (const child of node.children) {
        lines = lines.concat(nodeToMermaid(child, depth + 1));
        lines.push(`${indent}${node.id} --> ${child.id}`);
      }
    }
    
    return lines;
  };
  
  // Build complete diagram
  const mermaidLines = ["graph TD"];
  mermaidLines.push(...nodeToMermaid(root));
  
  return "```mermaid\n" + mermaidLines.join("\n") + "\n```";
}

/**
 * Extract statistics from a tree
 * @param {Object} root - Root node of the tree
 * @returns {Object} Tree statistics
 */
export function extractTreeStatistics(root) {
  if (!root) return { nodeCount: 0, maxDepth: 0, avgBranchingFactor: 0 };
  
  let nodeCount = 0;
  let maxDepth = 0;
  let nonLeafNodes = 0;
  let totalChildren = 0;
  
  // Traverse the tree to calculate statistics
  const traverse = (node, depth = 0) => {
    if (!node) return;
    
    nodeCount++;
    maxDepth = Math.max(maxDepth, depth);
    
    if (node.children && node.children.length > 0) {
      nonLeafNodes++;
      totalChildren += node.children.length;
      
      for (const child of node.children) {
        traverse(child, depth + 1);
      }
    }
  };
  
  traverse(root);
  
  const avgBranchingFactor = nonLeafNodes > 0 ? totalChildren / nonLeafNodes : 0;
  
  return {
    nodeCount,
    maxDepth,
    avgBranchingFactor: parseFloat(avgBranchingFactor.toFixed(2)),
    leafNodes: nodeCount - nonLeafNodes,
    nonLeafNodes
  };
}

/**
 * Find a node by ID in a tree
 * @param {Object} root - Root node of the tree
 * @param {string} id - ID of the node to find
 * @returns {Object|null} Found node or null
 */
export function findNodeById(root, id) {
  if (!root) return null;
  if (root.id === id) return root;
  
  if (root.children && root.children.length > 0) {
    for (const child of root.children) {
      const found = findNodeById(child, id);
      if (found) return found;
    }
  }
  
  return null;
}

/**
 * Get the path from root to a specific node
 * @param {Object} root - Root node of the tree
 * @param {string} id - ID of the target node
 * @returns {Array} Array of nodes in the path
 */
export function getPathToNode(root, id) {
  if (!root) return [];
  
  const path = [];
  
  const findPath = (node, targetId, currentPath) => {
    if (!node) return false;
    
    currentPath.push(node);
    
    if (node.id === targetId) return true;
    
    if (node.children && node.children.length > 0) {
      for (const child of node.children) {
        if (findPath(child, targetId, currentPath)) return true;
      }
    }
    
    currentPath.pop();
    return false;
  };
  
  findPath(root, id, path);
  return path;
}