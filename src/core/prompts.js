// src/core/prompts.js

/**
 * Prompt templates for the LLM Instinct framework
 */

/**
 * Generate a prompt for the initial response
 * @param {string} problem - Problem statement
 * @param {string} context - Additional context
 * @returns {string} Formatted prompt
 */
export function generateInitialPrompt(problem, context) {
  return `
You are facing this problem: ${problem}

Additional context: ${context}

Provide an initial approach or solution to this problem. Think about both analytical reasoning and instinctual feelings about the best path forward.

Your response should be thoughtful and consider both the logical aspects of the problem and any intuitive insights you might have.
`;
}

/**
 * Generate a prompt for thought exploration
 * @param {string} problem - Problem statement
 * @param {string} context - Additional context
 * @param {string} currentApproach - Current approach content
 * @returns {string} Formatted prompt
 */
export function generateThoughtPrompt(problem, context, currentApproach) {
  return `
Given the following problem and context:

PROBLEM: ${problem}

CONTEXT: ${context}

And the current approach being considered:
"""
${currentApproach}
"""

Generate a next step, consideration, or alternative approach. Balance logical thinking with intuitive insights.

Your response should demonstrate one or more of these qualities:
1. Perseverance through challenges rather than giving up
2. Confidence when appropriate, even when facing uncertainty
3. Recognition of patterns that might not be immediately obvious
4. Ability to go against conventional wisdom when your instinct suggests it

Your response should be a single comprehensive paragraph explaining your suggested next step or consideration.
`;
}

/**
 * Generate a prompt for evaluating an approach
 * @param {string} problem - Problem statement
 * @param {string} context - Additional context
 * @param {string} approach - Approach content to evaluate
 * @returns {string} Formatted prompt
 */
export function generateEvaluationPrompt(problem, context, approach) {
  return `
Evaluate the quality of the following approach to this problem:

PROBLEM: ${problem}

CONTEXT: ${context}

APPROACH:
"""
${approach}
"""

Rate this approach on a scale from 1 to 10, where 10 is best.

Consider:
1. How well does this approach balance analysis with intuition?
2. Does it show perseverance in the face of uncertainty?
3. Is it creative and potentially effective?
4. Does it demonstrate conviction despite possible doubt?
5. Does it recognize patterns or insights that aren't immediately obvious?

Return only a single number from 1 to 10.
`;
}

/**
 * Generate a prompt for emotional state analysis
 * @param {string} content - Content to analyze
 * @returns {string} Formatted prompt
 */
export function generateEmotionalAnalysisPrompt(content) {
  return `
Analyze the following text and provide scores for these dimensions:
1. Confidence (1-10): How confident does the author appear?
2. Perseverance (1-10): How much determination to continue despite challenges?
3. Instinct vs Analysis (1-10): Is this more instinct-driven (10) or analytical (1)?
4. Emotional State (1-10): How positive is the emotional tone?

Text to analyze:
"""
${content}
"""

Provide your response in JSON format like this: {"confidence": 7, "perseverance": 8, "instinctVsAnalysis": 6, "emotionalState": 5}
`;
}

/**
 * Generate a prompt for branch exploration
 * @param {string} problem - Problem statement
 * @param {string} context - Additional context
 * @param {string} currentPath - Description of the current decision path
 * @param {string} branch - Branch instruction
 * @returns {string} Formatted prompt
 */
export function generateBranchExplorationPrompt(problem, context, currentPath, branch) {
  return `
You're exploring a decision tree for the following problem:

PROBLEM: ${problem}

CONTEXT: ${context}

The current decision path you've been following is:
"""
${currentPath}
"""

Now, you want to explore a branch where: ${branch}

Generate a new approach that follows this branch. Your approach should:
1. Address the original problem
2. Incorporate the branch direction
3. Balance logical reasoning with intuitive insights
4. Demonstrate conviction even if the path seems uncertain

Your response should be a comprehensive paragraph describing this new approach.
`;
}

/**
 * Generate a prompt for analyzing perseverance indicators
 * @param {string} content - Content to analyze
 * @returns {string} Formatted prompt
 */
export function generatePerseveranceAnalysisPrompt(content) {
  return `
Analyze the following text for indicators of perseverance and doubt:

"""
${content}
"""

Identify words, phrases, or themes that indicate:
1. Perseverance (continuing despite challenges)
2. Doubt (uncertainty or giving up)

Provide a score from 1-10 where 10 indicates strong perseverance and 1 indicates strong doubt.
Return only the score as a single number.
`;
}

/**
 * Generate a prompt for final recommendation
 * @param {string} problem - Problem statement
 * @param {string} context - Additional context
 * @param {Array<string>} approaches - List of candidate approaches
 * @returns {string} Formatted prompt
 */
export function generateFinalRecommendationPrompt(problem, context, approaches) {
  const approachesText = approaches.map((a, i) => `APPROACH ${i+1}:\n"""${a}"""\n`).join('\n');
  
  return `
You're solving the following problem:

PROBLEM: ${problem}

CONTEXT: ${context}

You've explored these approaches:

${approachesText}

Based on these approaches, synthesize a final recommendation that:
1. Combines the strongest elements of the approaches
2. Demonstrates conviction despite uncertainty
3. Acknowledges challenges but maintains perseverance
4. Balances analytical reasoning with intuitive insights
5. Provides a clear path forward

Your response should be a comprehensive recommendation that someone could actually implement.
`;
}