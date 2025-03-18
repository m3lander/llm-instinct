# LLM Instinct: Simulating Instinct-Driven Decision Making with LLMs

<p align="center">
  <b>A framework for eliciting instinct-like behavior in Large Language Models</b>
</p>

<p align="center">
  <a href="#installation">Installation</a> •
  <a href="#usage">Usage</a> •
  <a href="#theory">Theory</a> •
  <a href="#architecture">Architecture</a> •
  <a href="#examples">Examples</a> •
  <a href="#contributing">Contributing</a>
</p>

## 🌟 Overview

**LLM Instinct** is a proof-of-concept that simulates human-like instinctual decision-making in LLMs. While conventional LLM usage prioritizes analytical reasoning, this framework integrates components of persistence, emotional confidence, and intuitive leaps—qualities that often drive human success in uncertain endeavors.

As the inspiring tweet noted:

> _"Most ppl don't realize that early investments, whether in money, skills, relationships, or ideas require conviction before the payoff is clear. that means tons of discomfort, likely social resistance, & extreme self doubt."_

This project explores how to embed that instinct-driven conviction into LLM decision processes.

## 🚀 Key Features

- **Instinct-weighted MCTS algorithm**: Modified Monte Carlo Tree Search that balances analysis with intuition
- **Emotional state tracking**: Simulates confidence and doubt within decision paths
- **Perseverance biasing**: Rewards paths that persist through uncertainty
- **Interactive visualization**: Explore and modify decision trees as they develop
- **OpenRouter integration**: Utilize various LLM models through a simple API

## 📋 Installation

```bash
# Clone the repository
git clone https://github.com/m3lander/llm-instinct.git
cd llm-instinct

# Install dependencies
npm install

# Start the development server
npm start
```

## 🎮 Usage

### Web Application

1. Open the application in your browser (default: http://localhost:3000)
2. Enter your OpenRouter API key
3. Select a model to use
4. Define a problem and its context
5. Adjust algorithm parameters if desired
6. Start the simulation
7. Explore the resulting decision tree
8. Modify nodes and see how different choices affect the outcome

### API

```javascript
import { InstinctMCTS } from 'llm-instinct';

// Create an instance with custom parameters
const mcts = new InstinctMCTS({
  apiKey: 'your-openrouter-api-key',
  model: 'anthropic/claude-3-opus',
  explorationWeight: 1.5,
  instinctRatio: 0.7,
  perseveranceFactor: 0.8
});

// Run a simulation
const result = await mcts.simulate({
  problem: 'Starting a business in a competitive market',
  context: 'Limited funding but unique product approach...',
  iterations: 3,
  simulationsPerIteration: 5
});

// Get the decision tree and recommended approach
console.log(result.bestApproach);
visualizeTree(result.tree);
```

## 🧠 Theory

### The Instinct-Intelligence Balance

Human decision-making operates on dual systems:
- **System 1**: Fast, intuitive, emotional ("instinct")
- **System 2**: Slow, deliberate, analytical ("intelligence")

Traditional LLMs excel at System 2 thinking but lack the instinctual persistence that drives humans through uncertainty. This project simulates that missing component.

### How LLM Instinct Works

The framework modifies MCTS (Monte Carlo Tree Search) by:

1. **Exploration vs. Exploitation**: Balancing analytical evaluation with random "gut feeling" choices
2. **Emotional State**: Tracking confidence levels for each decision node
3. **Perseverance Weighting**: Boosting paths that demonstrate conviction despite challenges
4. **Content Analysis**: Evaluating text for confidence indicators and persistence markers

## 🏗️ Architecture

### Core Components

- **InstinctMCTS**: The main algorithm orchestrating the decision process
- **Node**: Represents a single decision point with associated content and metrics
- **OpenRouter Client**: Handles communication with LLM models
- **Evaluators**: Analyze text content for various metrics (persistence, confidence, etc.)
- **Visualization**: Interactive tree representation

## 📊 Examples

### Business Investment Decision

Starting with the problem: "Investing in an unproven technology startup"

**Best Approach**: "While financial analysis indicates high risk due to unproven technology, several patterns from successful past investments align here: passionate founding team, clear problem-solution fit, and scalable technology. Maintain conviction by establishing concrete 6-month milestones that test core assumptions, while documenting early customer feedback patterns. The minimum viable commitment is a staged investment with clear exit points, while creating a decision journal to track both analytical and intuitive drivers over time."

### Creative Project Decision

Starting with the problem: "Continuing a novel that has received mixed early feedback"

**Best Approach**: "Despite mixed feedback, the persistent core enthusiasm for the novel's premise and characters suggests untapped potential. The path forward involves a deliberate 3-month revision focused specifically on the pacing and character development issues mentioned by multiple readers, while preserving the unique voice that generated positive responses. Conviction will be maintained by reconnecting with the original inspiration through weekly reflection and documenting instances where reader feedback resonates with your own instincts about improvement areas."

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📜 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgements

- Inspired by the tweet thread on conviction in early investments
- Built upon Monte Carlo Tree Search algorithms
- Incorporates Tree of Thought prompting concepts
- Utilizes OpenRouter for model access