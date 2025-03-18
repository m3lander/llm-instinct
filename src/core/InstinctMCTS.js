// src/core/InstinctMCTS.js

import Node from './Node';
import { generateThoughtPrompt, generateEvaluationPrompt } from './prompts';

/**
 * Instinct-driven Monte Carlo Tree Search for decision making
 * Extends traditional MCTS with emotional state tracking and perseverance biasing
 */
class InstinctMCTS {
  /**
   * Create a new InstinctMCTS instance
   * @param {Object} params - Configuration parameters
   * @param {Object} params.llmClient - LLM API client
   * @param {string} params.problem - Problem statement
   * @param {string} params.context - Additional context
   * @param {number} params.explorationWeight - Exploration weight for UCT (default: 1.4)
   * @param {number} params.instinctRatio - Balance between instinct and analysis (default: 0.6)
   * @param {number} params.confidenceBias - Bias toward confident responses (default: 0.2)
   * @param {number} params.perseveranceFactor - Factor to boost perseverance (default: 0.7)
   */
  constructor({
    llmClient,
    problem = '',
    context = '',
    explorationWeight = 1.4,
    instinctRatio = 0.6, 
    confidenceBias = 0.2,
    perseveranceFactor = 0.7
  }) {
    this.llmClient = llmClient;
    this.problem = problem;
    this.context = context;
    this.explorationWeight = explorationWeight;
    this.instinctRatio = instinctRatio;
    this.confidenceBias = confidenceBias;
    this.perseveranceFactor = perseveranceFactor;
    
    this.root = null;
    this.selectedNode = null;
    this.treeHistory = [];
    this.onUpdate = null;
  }

  /**
   * Initialize the tree with an initial response
   * @returns {Promise<Node>} The root node
   */
  async initialize() {
    // Generate initial prompt combining problem and context
    const initialPrompt = `
You are facing this problem: ${this.problem}

Additional context: ${this.context}

Provide an initial approach or solution to this problem. Think about both analytical reasoning and instinctual feelings about the best path forward.
`;

    try {
      // Get initial response from LLM
      const initialResponse = await this.llmClient.generateCompletion(initialPrompt, {
        temperature: 0.7
      });
      
      // Create root node
      this.root = new Node({
        content: initialResponse,
        explorationWeight: this.explorationWeight,
        confidenceBias: this.confidenceBias,
        perseveranceFactor: this.perseveranceFactor
      });
      
      // Analyze content for emotional state
      const analysis = await this.llmClient.analyzeContent(initialResponse);
      this.root.emotionalState = analysis.emotionalState / 10;
      this.root.instinctWeight = analysis.instinctVsAnalysis / 10;
      
      // Record initial tree state
      this._recordTreeState();
      
      return this.root;
    } catch (error) {
      console.error('Error initializing MCTS:', error);
      throw error;
    }
  }

  /**
   * Set update callback function
   * @param {Function} callback - Function to call on tree updates
   */
  setUpdateCallback(callback) {
    this.onUpdate = callback;
  }

  /**
   * Select a node to expand using UCT
   * @returns {Node} The selected node
   */
  select() {
    let node = this.root;
    
    while (node.children.length > 0) {
      // Sometimes use pure instinct (random choice) instead of UCT
      if (Math.random() < this.instinctRatio) {
        // Weight by emotional state - more confident nodes are more likely
        const weights = node.children.map(child => child.emotionalState);
        const totalWeight = weights.reduce((sum, weight) => sum + weight, 0.001);
        const normalizedWeights = weights.map(w => w / totalWeight);
        
        // Random selection based on weights
        const random = Math.random();
        let cumulativeWeight = 0;
        
        for (let i = 0; i < node.children.length; i++) {
          cumulativeWeight += normalizedWeights[i];
          if (random <= cumulativeWeight) {
            node = node.children[i];
            break;
          }
        }
      } else {
        // Use UCT for more analytical choice
        node = node.children.reduce((best, child) => {
          return child.uctValue() > best.uctValue() ? child : best;
        }, node.children[0]);
      }
    }
    
    this.selectedNode = node;
    return node;
  }

  /**
   * Expand a node by generating child nodes
   * @param {Node} node - The node to expand
   * @param {number} numChildren - Number of children to generate
   * @returns {Promise<Node>} A selected child node
   */
  async expand(node, numChildren = 2) {
    try {
      // Generate multiple thoughts in parallel
      const thoughtPrompts = Array(numChildren).fill().map(() => {
        return generateThoughtPrompt(this.problem, this.context, node.content);
      });
      
      const thoughts = await Promise.all(
        thoughtPrompts.map(prompt => this.llmClient.generateCompletion(prompt))
      );
      
      // Create and analyze child nodes
      const childNodes = [];
      
      for (const thought of thoughts) {
        // Create child node
        const child = node.addChild(thought);
        
        // Analyze content for emotional state and instinct weight
        const analysis = await this.llmClient.analyzeContent(thought);
        child.emotionalState = analysis.emotionalState / 10;
        child.instinctWeight = analysis.instinctVsAnalysis / 10;
        child.confidence = analysis.confidence / 10;
        child.perseverance = analysis.perseverance / 10;
        
        childNodes.push(child);
      }
      
      // Sort children by instinct weight for selection
      childNodes.sort((a, b) => b.instinctWeight - a.instinctWeight);
      
      // Update tree view if callback is provided
      if (this.onUpdate) {
        this.onUpdate(this._getCurrentTreeState());
      }
      
      // Return a child, preferring those with higher instinct weight
      return childNodes[0];
    } catch (error) {
      console.error('Error expanding node:', error);
      throw error;
    }
  }

  /**
   * Simulate to evaluate a node
   * @param {Node} node - The node to evaluate
   * @returns {Promise<number>} Evaluation score
   */
  async simulate(node) {
    try {
      // Create evaluation prompt
      const evalPrompt = generateEvaluationPrompt(
        this.problem,
        this.context, 
        node.content
      );
      
      // Get evaluation from LLM
      const evaluation = await this.llmClient.generateCompletion(evalPrompt, {
        temperature: 0.3,
        maxTokens: 10
      });
      
      // Extract score from evaluation (1-10)
      const match = evaluation.match(/(\d+)/);
      let score = 5; // Default middle score
      
      if (match) {
        score = Math.min(10, Math.max(1, parseInt(match[0], 10)));
      }
      
      // Apply perseverance bonus
      if (this._showsPerseverance(node.content)) {
        score *= (1 + node.perseveranceFactor);
      }
      
      return score;
    } catch (error) {
      console.error('Error simulating node:', error);
      return 5; // Default middle score on error
    }
  }

  /**
   * Backpropagate the result through the tree
   * @param {Node} node - The starting node
   * @param {number} score - The evaluation score
   */
  backpropagate(node, score) {
    let current = node;
    
    while (current) {
      current.visits += 1;
      current.value += score;
      
      // Adjust emotional state based on score
      const emotionalImpact = (score / 10.0) - 0.5; // Convert to -0.5 to 0.5 range
      current.emotionalState = Math.max(0, Math.min(1, 
        current.emotionalState + emotionalImpact * 0.2
      ));
      
      current = current.parent;
    }
  }

  /**
   * Perform the MCTS search
   * @param {number} numSimulations - Number of simulations to run
   * @returns {Promise<Node>} The best node found
   */
  async search(numSimulations = 10) {
    for (let i = 0; i < numSimulations; i++) {
      // Select node
      let leaf = this.select();
      
      // If not fully expanded, expand it
      if (leaf.children.length < 2) {
        leaf = await this.expand(leaf);
      }
      
      // Simulate from this leaf
      const score = await this.simulate(leaf);
      
      // Backpropagate the score
      this.backpropagate(leaf, score);
      
      // Record tree state
      this._recordTreeState();
      
      // Update UI if callback is provided
      if (this.onUpdate) {
        this.onUpdate(this._getCurrentTreeState());
      }
    }
    
    // Return the best child of the root
    return this.getBestNode();
  }

  /**
   * Get the best node based on visits
   * @returns {Node} The best node
   */
  getBestNode() {
    if (!this.root) return null;
    
    // Start at root and follow most-visited children
    let current = this.root;
    
    while (current.children.length > 0) {
      current = current.children.reduce((best, child) => {
        return child.visits > best.visits ? child : best;
      }, current.children[0]);
    }
    
    return current;
  }

  /**
   * Run a complete simulation
   * @param {number} iterations - Number of iterations
   * @param {number} simulationsPerIteration - Simulations per iteration
   * @returns {Promise<Object>} Simulation results
   */
  async simulate(iterations = 3, simulationsPerIteration = 5) {
    if (!this.root) {
      await this.initialize();
    }
    
    let bestNode = this.root;
    let bestScore = -Infinity;
    
    for (let i = 0; i < iterations; i++) {
      // Run a batch of simulations
      await this.search(simulationsPerIteration);
      
      // Evaluate the current best node
      const currentBest = this.getBestNode();
      const score = await this.simulate(currentBest);
      
      // Update best if improved
      if (score > bestScore) {
        bestScore = score;
        bestNode = currentBest;
      }
    }
    
    return {
      bestApproach: bestNode.content,
      bestNode: bestNode,
      bestScore: bestScore,
      treeHistory: this.treeHistory,
      finalTree: this._getCurrentTreeState()
    };
  }

  /**
   * Check if content shows perseverance
   * @param {string} content - The text content to analyze
   * @returns {boolean} True if content shows perseverance
   * @private
   */
  _showsPerseverance(content) {
    const perseveranceIndicators = [
      "continue", "persist", "keep going", "don't give up", 
      "try again", "despite", "nevertheless", "however",
      "still worth", "potential", "opportunity", "challenge"
    ];
    
    const doubtIndicators = [
      "stop", "quit", "abandon", "too difficult", "impossible",
      "not worth", "failure", "unlikely", "risky", "doubt"
    ];
    
    // Count indicators (case insensitive)
    const contentLower = content.toLowerCase();
    const perseveranceCount = perseveranceIndicators.filter(word => 
      contentLower.includes(word.toLowerCase())
    ).length;
    
    const doubtCount = doubtIndicators.filter(word => 
      contentLower.includes(word.toLowerCase())
    ).length;
    
    // Return true if more perseverance indicators than doubt
    return perseveranceCount > doubtCount;
  }

  /**
   * Record the current state of the tree for history
   * @private
   */
  _recordTreeState() {
    this.treeHistory.push(this._getCurrentTreeState());
  }

  /**
   * Get the current tree state as a structured object
   * @returns {Object} Tree state
   * @private
   */
  _getCurrentTreeState() {
    const nodeToObject = (node) => {
      return {
        id: node.id,
        content: node.content,
        visits: node.visits,
        value: node.value,
        emotionalState: node.emotionalState,
        instinctWeight: node.instinctWeight,
        confidence: node.confidence,
        perseverance: node.perseverance,
        children: node.children.map(nodeToObject)
      };
    };
    
    return {
      tree: nodeToObject(this.root),
      selectedNodeId: this.selectedNode ? this.selectedNode.id : null,
      timestamp: Date.now()
    };
  }

  /**
   * Generate a Mermaid diagram of the tree
   * @returns {string} Mermaid diagram
   */
  generateMermaidDiagram() {
    // Escape special characters in strings for Mermaid
    const escape = (str) => {
      return str.replace(/"/g, '&quot;')
                .replace(/\(/g, '&#40;')
                .replace(/\)/g, '&#41;');
    };
    
    // Convert node to Mermaid format
    const nodeToMermaid = (node, depth = 0) => {
      const indent = "    ".repeat(depth);
      
      // Calculate color based on emotional state (red to green)
      const r = Math.floor(255 * (1 - node.emotionalState));
      const g = Math.floor(255 * node.emotionalState);
      const nodeColor = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}00`;
      
      // Node content preview (limited to 20 chars)
      const contentPreview = escape(
        node.content.substring(0, 20) + (node.content.length > 20 ? '...' : '')
      );
      
      // Node declaration
      let lines = [
        `${indent}${node.id}["${node.id}: ${node.visits} - ${contentPreview}"]`,
        `${indent}style ${node.id} fill:${nodeColor}`
      ];
      
      // Add children and connections
      for (const child of node.children) {
        lines = lines.concat(nodeToMermaid(child, depth + 1));
        lines.push(`${indent}${node.id} --> ${child.id}`);
      }
      
      return lines;
    };
    
    if (!this.root) {
      return "```mermaid\ngraph TD\n    A[No tree initialized yet]\n```";
    }
    
    // Build complete diagram
    const mermaidLines = ["graph TD"];
    mermaidLines.push(...nodeToMermaid(this.root));
    
    return "```mermaid\n" + mermaidLines.join("\n") + "\n```";
  }
}

export default InstinctMCTS;