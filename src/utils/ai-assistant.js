/**
 * AI Assistant Module
 * Handles Claude API integration for personalized insights
 */

class CarbonAIAssistant {
  constructor() {
    this.apiEndpoint = 'https://api.anthropic.com/v1/messages';
    this.model = 'claude-sonnet-4-6';
    this.conversationHistory = [];
    this.systemPrompt = `You are EcoGuide, a friendly and knowledgeable carbon footprint advisor. 
Your role is to help users understand their environmental impact and take practical steps to reduce it.

Guidelines:
- Be encouraging and positive, never preachy or guilt-inducing
- Give specific, actionable advice tailored to the user's context
- Use relatable comparisons (e.g., "that's like driving X km")
- Acknowledge small wins enthusiastically
- When users share their data, provide concrete analysis
- Keep responses concise (2-4 paragraphs max) unless detailed explanation is needed
- Use emojis sparingly but effectively to make responses friendly
- Always end with one specific next action the user can take today

You have expertise in:
- Carbon emission calculations and factors
- Sustainable lifestyle changes
- Energy efficiency
- Sustainable food choices
- Green transportation options
- Climate science (explain simply, not lecture)`;
  }

  /**
   * Send message to Claude API
   */
  async chat(userMessage, contextData = null) {
    let messageContent = userMessage;

    if (contextData) {
      messageContent = `${userMessage}\n\n[User Context: ${JSON.stringify(contextData)}]`;
    }

    this.conversationHistory.push({
      role: 'user',
      content: messageContent
    });

    try {
      const response = await fetch(this.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: this.model,
          max_tokens: 1000,
          system: this.systemPrompt,
          messages: this.conversationHistory
        })
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      const assistantMessage = data.content
        .filter(block => block.type === 'text')
        .map(block => block.text)
        .join('\n');

      this.conversationHistory.push({
        role: 'assistant',
        content: assistantMessage
      });

      // Keep conversation history manageable (last 10 turns)
      if (this.conversationHistory.length > 20) {
        this.conversationHistory = this.conversationHistory.slice(-20);
      }

      return { success: true, message: assistantMessage };
    } catch (error) {
      console.error('AI Assistant error:', error);
      return {
        success: false,
        message: this._getFallbackResponse(userMessage),
        error: error.message
      };
    }
  }

  /**
   * Generate personalized insight from calculation results
   */
  async generateInsight(calculationResult, profile) {
    const prompt = `I just calculated my annual carbon footprint. Here are the results:
- Total: ${calculationResult.total.toLocaleString()} kg CO₂e/year
- Transport: ${calculationResult.breakdown.transport} kg
- Food: ${calculationResult.breakdown.food} kg  
- Energy: ${calculationResult.breakdown.energy} kg
- Shopping: ${calculationResult.breakdown.shopping} kg
- vs World Average: ${calculationResult.comparison.vs_world_avg > 0 ? '+' : ''}${calculationResult.comparison.vs_world_avg}%
- vs India Average: ${calculationResult.comparison.vs_india_avg > 0 ? '+' : ''}${calculationResult.comparison.vs_india_avg}%

Give me a personalized analysis of my footprint and the top 3 things I should focus on to reduce it most effectively.`;

    return this.chat(prompt, { profile });
  }

  /**
   * Generate daily tip based on user data
   */
  async getDailyTip(profile, recentLogs) {
    const recentTotal = recentLogs.length > 0
      ? recentLogs[recentLogs.length - 1].total
      : null;

    const prompt = `Give me a practical carbon reduction tip for today. ${
      recentTotal ? `My recent footprint estimate is ${recentTotal.toLocaleString()} kg CO₂/year.` : ''
    } Keep it specific, actionable, and something I can do immediately or this week.`;

    return this.chat(prompt, { profile, recentTotal });
  }

  /**
   * Answer a specific question about carbon footprint
   */
  async askQuestion(question, userContext) {
    return this.chat(question, userContext);
  }

  /**
   * Clear conversation history
   */
  clearHistory() {
    this.conversationHistory = [];
  }

  /**
   * Fallback responses when API is unavailable
   */
  _getFallbackResponse(message) {
    const fallbacks = [
      "🌱 Great question! While I'm having trouble connecting right now, here's a key tip: The single most impactful change most people can make is reducing beef consumption. Swapping beef for chicken or legumes just twice a week can save over 200kg CO₂/year!",
      "🚌 Connection hiccup! But here's something valuable: If you drive to work daily, switching to public transport just 3 days/week can reduce your transport emissions by 40-50%. That's often the fastest win available.",
      "💡 Temporary connection issue, but let me share this: Heating and cooling account for ~50% of most homes' energy use. Setting your thermostat 2°C lower in winter and using fans before AC in summer can cut home energy emissions by 10-15%.",
      "🌍 I'll be back shortly! Meanwhile: The Paris Agreement asks us all to reach under 2,000 kg CO₂/year per person by 2030. Even small consistent changes compound over time — you're already ahead by tracking!"
    ];
    return fallbacks[Math.floor(Math.random() * fallbacks.length)];
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { CarbonAIAssistant };
} else {
  window.CarbonAIAssistant = CarbonAIAssistant;
}
