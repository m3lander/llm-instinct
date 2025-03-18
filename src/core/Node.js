// src/core/Node.js

/**
 * A node in the instinct-based decision tree
 */
class Node {
  /**
   * Create a new Node instance
   * @param {Object} params - Node parameters
   * @param {string} params.id - Node identifier (generated if not provided)
   * @param {string} params.content - Node content
   * @param {Node} params.parent - Parent node
   * @param {number} params.explorationWeight - Exploration weight for UCT
   * @param {number} params.confidenceBias - Bias toward confident responses
   * @param {number} params.perseveranceFactor - Factor to boost perseverance
   */
  constructor({
    id = null,
    content = '',
    parent = null,
    explorationWeight = 1.4,
    confidenceBias = 0.2,
    perseveranceFactor = 0.7
  }) {
    // Generate random ID if not provided
    this.id = id || this._generateId();
    this.content = content;
    this.parent = parent;
    this.children = [];
    this.visits = 0;
    this.value = 0;
    
    // Parameters for UCT and instinct simulation
    this.explorationWeight = explorationWeight;
    this.confidenceBias = confidenceBias;
    this.perseveranceFactor = perseveranceFactor;
    
    // State variables
    this.emotionalState = 0.5; // Initial neutral emotional state (0-1)
    this.instinctWeight = 0.5; // Weight given to instinctual vs rational decisions
    this.confidence = 0.5;     // Confidence level (0-1)
    this.perseverance = 0.5;   // Perseverance level (0-1)
    
    // Metadata for visualization and tracking
    this.createdAt = Date.now();
    this.updatedAt = Date.now();
    this.depth = parent ? parent.depth + 1 : 0;
    this.path = parent ? [...parent.path, parent.id] : [];
  }

  /**
   * Generate a random ID
   * @returns {string} Random ID
   * @private
   */
  _generateId() {
    const chars = 'abcdefghijklmnopqrstuvwxyz';
    return Array(6).fill().map(() => chars[Math.floor(Math.random() * chars.length)]).join('');
  }

  /**
   * Add a child node
   * @param {string} content - Content for the child node
   * @returns {Node} The new child node
   */
  addChild(content) {
    const child = new Node({
      content,
      parent: this,
      explorationWeight: this.explorationWeight,
      confidenceBias: this.confidenceBias,
      perseveranceFactor: this.perseveranceFactor
    });
    
    this.children.push(child);
    this.updatedAt = Date.now();
    
    return child;
  }

  /**
   * Calculate UCT value with instinct modifications
   * @returns {number} UCT value
   */
  uctValue() {
    const epsilon = 1e-6; // Small value to avoid division by zero
    
    // No UCT for root node
    if (!this.parent) {
      return 0;
    }
    
    // Base UCT calculation
    const exploitation = this.value / (this.visits + epsilon);
    const exploration = this.explorationWeight * Math.sqrt(
      Math.log(this.parent.visits + epsilon) / (this.visits + epsilon)
    );
    
    // Apply confidence bias
    const confidenceModifier = this.confidenceBias * this.emotionalState;
    
    // Apply perseverance boost
    const perseveranceBoost = this.perseverance * this.perseveranceFactor;
    
    return exploitation + exploration * (1 + confidenceModifier) + perseveranceBoost;
  }

  /**
   * Get the node's state as a plain object
   * @returns {Object} Node state
   */
  getState() {
    return {
      id: this.id,
      content: this.content,
      visits: this.visits,
      value: this.value,
      emotionalState: this.emotionalState,
      instinctWeight: this.instinctWeight,
      confidence: this.confidence,
      perseverance: this.perseverance,
      depth: this.depth,
      path: this.path,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      childrenCount: this.children.length
    };
  }

  /**
   * Find a node by ID in this subtree
   * @param {string} id - Node ID to find
   * @returns {Node|null} Found node or null
   */
  findNodeById(id) {
    if (this.id === id) {
      return this;
    }
    
    for (const child of this.children) {
      const found = child.findNodeById(id);
      if (found) {
        return found;
      }
    }
    
    return null;
  }

  /**
   * Update node content
   * @param {string} content - New content
   */
  updateContent(content) {
    this.content = content;
    this.updatedAt = Date.now();
  }

  /**
   * Update node parameters
   * @param {Object} params - Parameters to update
   */
  updateParameters(params) {
    if ('emotionalState' in params) {
      this.emotionalState = Math.max(0, Math.min(1, params.emotionalState));
    }
    
    if ('instinctWeight' in params) {
      this.instinctWeight = Math.max(0, Math.min(1, params.instinctWeight));
    }
    
    if ('confidence' in params) {
      this.confidence = Math.max(0, Math.min(1, params.confidence));
    }
    
    if ('perseverance' in params) {
      this.perseverance = Math.max(0, Math.min(1, params.perseverance));
    }
    
    if ('explorationWeight' in params) {
      this.explorationWeight = params.explorationWeight;
    }
    
    if ('confidenceBias' in params) {
      this.confidenceBias = params.confidenceBias;
    }
    
    if ('perseveranceFactor' in params) {
      this.perseveranceFactor = params.perseveranceFactor;
    }
    
    this.updatedAt = Date.now();
  }

  /**
   * Get all nodes in this subtree
   * @returns {Array<Node>} Array of nodes
   */
  getAllNodes() {
    const nodes = [this];
    
    for (const child of this.children) {
      nodes.push(...child.getAllNodes());
    }
    
    return nodes;
  }
}

export default Node;