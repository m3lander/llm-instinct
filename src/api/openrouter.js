// src/api/openrouter.js

/**
 * OpenRouter API client for LLM Instinct
 * Handles communication with various LLM models through OpenRouter
 */

const BASE_URL = 'https://openrouter.ai/api/v1';

/**
 * OpenRouter API client
 */
class OpenRouterClient {
  /**
   * Create a new OpenRouter client
   * @param {string} apiKey - OpenRouter API key
   * @param {string} defaultModel - Default model to use
   * @param {Object} options - Additional options
   */
  constructor(apiKey, defaultModel = 'anthropic/claude-3-sonnet', options = {}) {
    this.apiKey = apiKey;
    this.defaultModel = defaultModel;
    this.options = {
      timeout: 60000, // 60 seconds
      retries: 2,
      ...options
    };
  }

  /**
   * Fetch available models from OpenRouter
   * @returns {Promise<Array>} List of available models
   */
  async getModels() {
    try {
      const response = await fetch(`${BASE_URL}/models`, {
        method: 'GET',
        headers: this._getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch models: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error fetching models:', error);
      throw error;
    }
  }

  /**
   * Generate completion from the LLM
   * @param {string} prompt - The prompt to send to the model
   * @param {Object} options - Additional options for the request
   * @returns {Promise<string>} The generated text
   */
  async generateCompletion(prompt, options = {}) {
    const model = options.model || this.defaultModel;
    const temperature = options.temperature || 0.7;
    const maxTokens = options.maxTokens || 500;

    try {
      const response = await fetch(`${BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: this._getHeaders(),
        body: JSON.stringify({
          model: model,
          messages: [
            { role: 'user', content: prompt }
          ],
          temperature: temperature,
          max_tokens: maxTokens,
          stream: false,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OpenRouter API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      return data.choices[0].message.content;
    } catch (error) {
      console.error('Error generating completion:', error);
      throw error;
    }
  }

  /**
   * Generate a streaming completion
   * @param {string} prompt - The prompt to send to the model
   * @param {Object} options - Additional options for the request
   * @param {Function} onChunk - Callback for each chunk of generated text
   * @returns {Promise<string>} The complete generated text
   */
  async generateStreamingCompletion(prompt, options = {}, onChunk = null) {
    const model = options.model || this.defaultModel;
    const temperature = options.temperature || 0.7;
    const maxTokens = options.maxTokens || 500;

    try {
      const response = await fetch(`${BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: this._getHeaders(),
        body: JSON.stringify({
          model: model,
          messages: [
            { role: 'user', content: prompt }
          ],
          temperature: temperature,
          max_tokens: maxTokens,
          stream: true,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OpenRouter API error: ${response.status} - ${errorText}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let completeText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (!line.trim() || !line.startsWith('data: ')) continue;
          if (line.includes('[DONE]')) continue;
          
          try {
            const jsonStr = line.slice(6); // Remove 'data: ' prefix
            const json = JSON.parse(jsonStr);
            
            if (json.choices && json.choices[0]) {
              const content = json.choices[0].delta?.content || '';
              if (content) {
                completeText += content;
                if (onChunk) onChunk(content);
              }
            }
          } catch (e) {
            console.warn('Error parsing streaming response:', e);
          }
        }
      }

      return completeText;
    } catch (error) {
      console.error('Error generating streaming completion:', error);
      throw error;
    }
  }

  /**
   * Generate multiple completions for thought exploration
   * @param {string} prompt - The base prompt to send
   * @param {number} count - Number of completions to generate
   * @param {Object} options - Additional options
   * @returns {Promise<Array<string>>} Array of completions
   */
  async generateMultipleCompletions(prompt, count = 3, options = {}) {
    const results = [];
    const model = options.model || this.defaultModel;
    const temperature = options.temperature || 0.9; // Higher temperature for more diverse results
    
    // Use slightly higher temperature for each subsequent completion to increase diversity
    const promises = Array(count).fill().map((_, i) => {
      return this.generateCompletion(prompt, {
        ...options,
        model,
        temperature: Math.min(temperature + (i * 0.1), 1.0),
      });
    });
    
    return Promise.all(promises);
  }

  /**
   * Evaluate a piece of text against specific criteria
   * @param {string} text - The text to evaluate
   * @param {string} criteria - Evaluation criteria
   * @param {Object} options - Additional options
   * @returns {Promise<number>} Evaluation score (1-10)
   */
  async evaluateText(text, criteria, options = {}) {
    const prompt = `
Rate the following text on a scale from 1 to 10 based on this criteria: "${criteria}"

Text to evaluate:
"""
${text}
"""

Provide only a single number from 1 to 10 as your response, where 1 is lowest and 10 is highest.
`;

    try {
      const result = await this.generateCompletion(prompt, {
        ...options,
        temperature: 0.3, // Lower temperature for more consistent ratings
        maxTokens: 10,
      });
      
      // Extract the numerical rating from the response
      const match = result.match(/(\d+)/);
      if (match) {
        const rating = parseInt(match[0], 10);
        if (rating >= 1 && rating <= 10) {
          return rating;
        }
      }
      
      console.warn('Could not parse rating from:', result);
      return 5; // Default middle rating
    } catch (error) {
      console.error('Error evaluating text:', error);
      return 5; // Default middle rating on error
    }
  }

  /**
   * Analyze text for emotional state and instinct indicators
   * @param {string} text - The text to analyze
   * @returns {Promise<Object>} Analysis results
   */
  async analyzeContent(text) {
    const prompt = `
Analyze the following text and provide scores for these dimensions:
1. Confidence (1-10): How confident does the author appear?
2. Perseverance (1-10): How much determination to continue despite challenges?
3. Instinct vs Analysis (1-10): Is this more instinct-driven (10) or analytical (1)?
4. Emotional State (1-10): How positive is the emotional tone?

Text to analyze:
"""
${text}
"""

Provide your response in JSON format like this: {"confidence": 7, "perseverance": 8, "instinctVsAnalysis": 6, "emotionalState": 5}
`;

    try {
      const result = await this.generateCompletion(prompt, {
        temperature: 0.3,
        maxTokens: 100,
      });
      
      // Extract JSON from the response
      const jsonMatch = result.match(/\{.*\}/s);
      if (jsonMatch) {
        try {
          return JSON.parse(jsonMatch[0]);
        } catch (e) {
          console.warn('Could not parse JSON from analysis:', e);
        }
      }
      
      console.warn('Could not extract JSON from analysis:', result);
      return {
        confidence: 5,
        perseverance: 5,
        instinctVsAnalysis: 5,
        emotionalState: 5
      };
    } catch (error) {
      console.error('Error analyzing content:', error);
      return {
        confidence: 5,
        perseverance: 5,
        instinctVsAnalysis: 5,
        emotionalState: 5
      };
    }
  }

  /**
   * Get headers for API requests
   * @returns {Object} Headers object
   * @private
   */
  _getHeaders() {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.apiKey}`,
      'HTTP-Referer': window.location.href, // Required by OpenRouter
      'X-Title': 'LLM Instinct Framework', // App identifier
    };
  }
}

export default OpenRouterClient;