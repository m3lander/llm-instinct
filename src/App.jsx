import React, { useState, useEffect, useRef } from 'react';
import DecisionTree from './components/DecisionTree';
import NodeDetails from './components/NodeDetails';
import OpenRouterClient from './api/openrouter';
import InstinctMCTS from './core/InstinctMCTS';

// Import example problems (will be loaded dynamically in real implementation)
import businessExamples from '../examples/business.json';
import creativeExamples from '../examples/creative.json';
import researchExamples from '../examples/research.json';
import personalExamples from '../examples/personal.json';

const App = () => {
  // State for API configuration
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState('anthropic/claude-3-sonnet');
  const [availableModels, setAvailableModels] = useState([]);
  const [apiConfigured, setApiConfigured] = useState(false);
  
  // State for problem definition
  const [problem, setProblem] = useState('');
  const [context, setContext] = useState('');
  const [examples, setExamples] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('business');
  
  // State for algorithm parameters
  const [explorationWeight, setExplorationWeight] = useState(1.4);
  const [instinctRatio, setInstinctRatio] = useState(0.6);
  const [confidenceBias, setConfidenceBias] = useState(0.2);
  const [perseveranceFactor, setPerseveranceFactor] = useState(0.7);
  const [iterations, setIterations] = useState(3);
  const [simulationsPerIteration, setSimulationsPerIteration] = useState(5);
  
  // State for simulation
  const [simulationRunning, setSimulationRunning] = useState(false);
  const [simulationProgress, setSimulationProgress] = useState(0);
  const [simulationStep, setSimulationStep] = useState('');
  
  // State for results
  const [treeData, setTreeData] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [bestApproach, setBestApproach] = useState('');
  const [simulationHistory, setSimulationHistory] = useState([]);
  
  // References
  const llmClientRef = useRef(null);
  const mctsRef = useRef(null);
  
  // Load example problems based on selected category
  useEffect(() => {
    switch (selectedCategory) {
      case 'business':
        setExamples(businessExamples.examples || []);
        break;
      case 'creative':
        setExamples(creativeExamples.examples || []);
        break;
      case 'research':
        setExamples(researchExamples.examples || []);
        break;
      case 'personal':
        setExamples(personalExamples.examples || []);
        break;
      default:
        setExamples([]);
    }
  }, [selectedCategory]);
  
  // Set up models when API key changes
  useEffect(() => {
    if (apiKey) {
      const client = new OpenRouterClient(apiKey, model);
      llmClientRef.current = client;
      
      // Fetch available models
      client.getModels()
        .then(models => {
          setAvailableModels(models);
          setApiConfigured(true);
        })
        .catch(error => {
          console.error('Error fetching models:', error);
          // Show fallback options
          setAvailableModels([
            { id: 'anthropic/claude-3-opus', name: 'Claude 3 Opus' },
            { id: 'anthropic/claude-3-sonnet', name: 'Claude 3 Sonnet' },
            { id: 'anthropic/claude-3-haiku', name: 'Claude 3 Haiku' },
            { id: 'openai/gpt-4-turbo', name: 'GPT-4 Turbo' },
            { id: 'openai/gpt-3.5-turbo', name: 'GPT-3.5 Turbo' }
          ]);
          setApiConfigured(true);
        });
    }
  }, [apiKey]);
  
  // Load example problem
  const loadExample = (example) => {
    setProblem(example.problem || '');
    setContext(example.context || '');
    
    // Apply suggested parameters if available
    if (example.suggested_parameters) {
      if (example.suggested_parameters.instinctRatio !== undefined) {
        setInstinctRatio(example.suggested_parameters.instinctRatio);
      }
      if (example.suggested_parameters.perseveranceFactor !== undefined) {
        setPerseveranceFactor(example.suggested_parameters.perseveranceFactor);
      }
    }
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!problem || !context || !apiConfigured) return;
    
    setSimulationRunning(true);
    setSimulationProgress(0);
    setSimulationStep('Initializing...');
    
    try {
      // Initialize MCTS
      const mcts = new InstinctMCTS({
        llmClient: llmClientRef.current,
        problem,
        context,
        explorationWeight,
        instinctRatio,
        confidenceBias,
        perseveranceFactor
      });
      
      mctsRef.current = mcts;
      
      // Set update callback
      mcts.setUpdateCallback((treeState) => {
        setTreeData(treeState.tree);
        setSimulationHistory(prev => [...prev, treeState]);
        
        // Calculate progress
        const totalSteps = iterations * simulationsPerIteration;
        const currentStep = mcts.treeHistory.length;
        const progress = Math.min(100, Math.round((currentStep / totalSteps) * 100));
        
        setSimulationProgress(progress);
        setSimulationStep(`Simulation ${currentStep} of ${totalSteps}`);
      });
      
      // Initialize tree
      await mcts.initialize();
      
      // Run simulation
      const result = await mcts.simulate(iterations, simulationsPerIteration);
      
      // Update results
      setTreeData(result.finalTree.tree);
      setBestApproach(result.bestApproach);
      setSelectedNode(result.bestNode);
      
    } catch (error) {
      console.error('Simulation error:', error);
      // Show error message
      alert(`Error during simulation: ${error.message}`);
    } finally {
      setSimulationRunning(false);
    }
  };
  
  // Handle node selection
  const handleNodeSelect = (node) => {
    setSelectedNode(node);
  };
  
  // Handle branch exploration
  const handleExploreAlternative = async () => {
    if (!selectedNode || !selectedNode.content) return;
    
    setSimulationRunning(true);
    setSimulationStep('Exploring alternative branch...');
    
    try {
      // Get current MCTS instance
      const mcts = mctsRef.current;
      if (!mcts) return;
      
      // Find the node in the tree
      const nodeInTree = mcts.root.findNodeById(selectedNode.id);
      if (!nodeInTree) return;
      
      // Expand this node with a new child
      const newChild = await mcts.expand(nodeInTree);
      
      // Simulate from this new child
      const score = await mcts.simulate(newChild);
      
      // Backpropagate the score
      mcts.backpropagate(newChild, score);
      
      // Update tree visualization
      setTreeData(mcts._getCurrentTreeState().tree);
      setSelectedNode(newChild);
      
    } catch (error) {
      console.error('Branch exploration error:', error);
      alert(`Error exploring alternative: ${error.message}`);
    } finally {
      setSimulationRunning(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-blue-700 text-white p-4 shadow-md">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">LLM Instinct</h1>
          <div className="flex items-center space-x-4">
            <span className="text-sm opacity-75">Instinct-Driven Decision Making</span>
          </div>
        </div>
      </header>
      
      <main className="container mx-auto p-4 mt-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column: Configuration */}
          <div className="col-span-1 space-y-6">
            {/* API Configuration */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-lg font-semibold mb-4">API Configuration</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    OpenRouter API Key
                  </label>
                  <input
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    placeholder="sk-or-v1-..."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Model
                  </label>
                  <select
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    disabled={!apiConfigured}
                  >
                    {availableModels.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            
            {/* Problem Definition */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-lg font-semibold mb-4">Problem Definition</h2>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Example Categories
                </label>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setSelectedCategory('business')}
                    className={`px-3 py-1 text-xs rounded-md ${
                      selectedCategory === 'business' 
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 hover:bg-gray-200'
                    }`}
                  >
                    Business
                  </button>
                  <button
                    onClick={() => setSelectedCategory('creative')}
                    className={`px-3 py-1 text-xs rounded-md ${
                      selectedCategory === 'creative' 
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 hover:bg-gray-200'
                    }`}
                  >
                    Creative
                  </button>
                  <button
                    onClick={() => setSelectedCategory('research')}
                    className={`px-3 py-1 text-xs rounded-md ${
                      selectedCategory === 'research' 
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 hover:bg-gray-200'
                    }`}
                  >
                    Research
                  </button>
                  <button
                    onClick={() => setSelectedCategory('personal')}
                    className={`px-3 py-1 text-xs rounded-md ${
                      selectedCategory === 'personal' 
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 hover:bg-gray-200'
                    }`}
                  >
                    Personal
                  </button>
                </div>
              </div>
              
              {examples.length > 0 && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Examples
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {examples.map((example, index) => (
                      <button
                        key={example.id || index}
                        onClick={() => loadExample(example)}
                        className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded-md transition"
                      >
                        {example.id || `Example ${index + 1}`}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Problem Statement
                  </label>
                  <textarea
                    value={problem}
                    onChange={(e) => setProblem(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    rows={3}
                    placeholder="Describe the problem or decision..."
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Context
                  </label>
                  <textarea
                    value={context}
                    onChange={(e) => setContext(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    rows={5}
                    placeholder="Additional context, constraints, background..."
                    required
                  />
                </div>
                
                <button
                  type="submit"
                  className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition"
                  disabled={simulationRunning || !apiConfigured}
                >
                  {simulationRunning ? 'Running Simulation...' : 'Start Simulation'}
                </button>
              </form>
            </div>
            
            {/* Algorithm Parameters */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-lg font-semibold mb-4">Algorithm Parameters</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Exploration Weight: {explorationWeight}
                  </label>
                  <input
                    type="range"
                    min="0.1"
                    max="3"
                    step="0.1"
                    value={explorationWeight}
                    onChange={(e) => setExplorationWeight(parseFloat(e.target.value))}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>More Focused</span>
                    <span>More Exploratory</span>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Instinct Ratio: {instinctRatio}
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={instinctRatio}
                    onChange={(e) => setInstinctRatio(parseFloat(e.target.value))}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>More Analytical</span>
                    <span>More Instinctual</span>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Confidence Bias: {confidenceBias}
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="0.5"
                    step="0.05"
                    value={confidenceBias}
                    onChange={(e) => setConfidenceBias(parseFloat(e.target.value))}
                    className="w-full"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Perseverance Factor: {perseveranceFactor}
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={perseveranceFactor}
                    onChange={(e) => setPerseveranceFactor(parseFloat(e.target.value))}
                    className="w-full"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Iterations
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={iterations}
                      onChange={(e) => setIterations(parseInt(e.target.value))}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Simulations / Iteration
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={simulationsPerIteration}
                      onChange={(e) => setSimulationsPerIteration(parseInt(e.target.value))}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Middle and right columns: Visualization and Details */}
          <div className="col-span-1 lg:col-span-2 space-y-6">
            {/* Simulation Progress */}
            {simulationRunning && (
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-lg font-semibold mb-4">Simulation Progress</h2>
                <div className="w-full bg-gray-200 rounded-full h-4">
                  <div 
                    className="bg-blue-600 h-4 rounded-full" 
                    style={{ width: `${simulationProgress}%` }}
                  ></div>
                </div>
                <p className="mt-2 text-sm text-gray-600">{simulationStep}</p>
              </div>
            )}
            
            {/* Tree Visualization */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-lg font-semibold mb-4">Decision Tree</h2>
              <div className="h-96">
                {treeData ? (
                  <DecisionTree 
                    treeData={treeData}
                    onNodeSelect={handleNodeSelect}
                    selectedNodeId={selectedNode?.id}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full bg-gray-100 rounded-lg">
                    <p className="text-gray-500">No simulation data yet</p>
                  </div>
                )}
              </div>
            </div>
            
            {/* Node Details */}
            <NodeDetails 
              node={selectedNode}
              onExploreAlternative={handleExploreAlternative}
              simulationRunning={simulationRunning}
            />
            
            {/* Best Approach */}
            {bestApproach && (
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-lg font-semibold mb-4">Best Approach</h2>
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
                  <p className="text-sm">{bestApproach}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;