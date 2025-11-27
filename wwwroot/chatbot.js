class TokenFlexChatbot {
  constructor() {
    this.isOpen = false;
    this.initializeElements();
    this.setupEventListeners();
    this.setupKeywordResponses();
  }

  initializeElements() {
    this.chatbotContainer = document.getElementById('chatbot-container');
    this.chatbotToggle = document.getElementById('chatbot-toggle');
    this.chatbotClose = document.getElementById('chatbot-close');
    this.chatbotInput = document.getElementById('chatbot-input');
    this.chatbotSend = document.getElementById('chatbot-send');
    this.chatbotMessages = document.getElementById('chatbot-messages');
  }

  setupEventListeners() {
    // Toggle chatbot
    this.chatbotToggle.addEventListener('click', () => this.toggleChatbot());
    this.chatbotClose.addEventListener('click', () => this.closeChatbot());

    // Send message
    this.chatbotSend.addEventListener('click', () => this.sendMessage());
    this.chatbotInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.sendMessage();
      }
    });

    // Auto-focus input when chatbot opens
    this.chatbotInput.addEventListener('focus', () => {
      this.chatbotInput.select();
    });
  }

  setupKeywordResponses() {
    this.responses = {
      // Token Flex specific responses
      'token flex': 'Token Flex is Autodesk\'s usage-based pricing model that allows you to pay for what you use across APS services. The charts above show your usage patterns and consumption.',
      
      'usage': 'Your usage data is displayed in the six charts above. Each chart represents different aspects of your Token Flex consumption including usage categories, product names, and time-based patterns.',
      
      'charts': 'The dashboard shows 6 different charts analyzing your Token Flex usage from various perspectives. Each chart helps you understand different aspects of your consumption patterns.',
      
      'contract': 'Use the dropdown menu at the top to select different contract numbers and view their respective usage data. Each contract may have different usage patterns and allocations.',
      
      'cost': 'Token Flex pricing is based on your actual usage. The charts help you analyze consumption patterns to optimize costs and predict future usage.',
      
      'api': 'This application uses the Autodesk Platform Services (APS) API to fetch and display your Token Flex usage data. The data is retrieved securely using OAuth authentication.',
      
      'help': 'I can help you with:\n• Understanding Token Flex concepts\n• Interpreting the usage charts\n• Explaining contract data\n• Navigating the dashboard\n• Cost optimization tips\n\nWhat would you like to know more about?',
      
      // Chart specific help
      'chart 1': 'Chart 1 shows your usage breakdown by category. This helps identify which services consume the most tokens.',
      'chart 2': 'Chart 2 displays usage by product name, showing which specific products are being used most frequently.',
      'chart 3': 'Chart 3 presents time-based usage patterns to help you understand consumption trends over time.',
      'chart 4': 'Chart 4 shows additional usage analytics to provide comprehensive insights into your Token Flex consumption.',
      'chart 5': 'Chart 5 displays comparative usage data across different metrics or time periods.',
      'chart 6': 'Chart 6 provides supplementary analytics to complete your usage overview.',
      
      // General responses
      'hello': 'Hello! I\'m here to help you understand your Token Flex usage data. What would you like to know?',
      'hi': 'Hi there! How can I assist you with your Token Flex dashboard today?',
      'thanks': 'You\'re welcome! Is there anything else you\'d like to know about your Token Flex usage?',
      'thank you': 'You\'re welcome! Feel free to ask if you have any other questions about Token Flex.',
      
      // Default response
      'default': 'I\'m here to help with Token Flex usage questions. You can ask me about:\n• Usage patterns and charts\n• Contract data\n• Cost optimization\n• Dashboard navigation\n\nWhat would you like to know?'
    };
  }

  toggleChatbot() {
    if (this.isOpen) {
      this.closeChatbot();
    } else {
      this.openChatbot();
    }
  }

  openChatbot() {
    this.chatbotContainer.classList.remove('chatbot-hidden');
    this.chatbotToggle.style.display = 'none';
    this.isOpen = true;
    
    // Focus on input
    setTimeout(() => {
      this.chatbotInput.focus();
    }, 300);
  }

  closeChatbot() {
    this.chatbotContainer.classList.add('chatbot-hidden');
    this.chatbotToggle.style.display = 'flex';
    this.isOpen = false;
  }

  async sendMessage() {
    const message = this.chatbotInput.value.trim();
    if (!message) return;

    // Clear input
    this.chatbotInput.value = '';

    // Add user message
    this.addMessage(message, 'user');

    // Show typing indicator
    this.showTypingIndicator();

    try {
      // First try server-side response for contextual queries
      if (this.shouldUseServerResponse(message)) {
        const response = await this.getServerResponse(message);
        this.hideTypingIndicator();
        this.addMessage(response, 'bot');
      } else {
        // Use local response for simple queries
        setTimeout(() => {
          this.hideTypingIndicator();
          const response = this.generateResponse(message);
          this.addMessage(response, 'bot');
        }, 1000 + Math.random() * 1000);
      }
    } catch (error) {
      console.error('Chatbot error:', error);
      this.hideTypingIndicator();
      this.addMessage('Sorry, I encountered an error. Please try again.', 'bot');
    }
  }

  shouldUseServerResponse(message) {
    const lowerMessage = message.toLowerCase();
    const serverKeywords = [
      'current usage', 'how much', 'total', 'highest', 'most used',
      'trends', 'pattern', 'optimization', 'reduce costs', 'my data'
    ];
    
    return serverKeywords.some(keyword => lowerMessage.includes(keyword));
  }

  async getServerResponse(message) {
    try {
      const response = await fetch('/api/chatbot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message,
          context: {
            currentPage: 'dashboard',
            timestamp: new Date().toISOString()
          }
        })
      });

      if (!response.ok) {
        throw new Error('Server response failed');
      }

      const data = await response.json();
      return data.response;
    } catch (error) {
      console.error('Server response error:', error);
      return this.generateResponse(message);
    }
  }

  addMessage(text, sender) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('chatbot-message', `${sender}-message`);

    const contentDiv = document.createElement('div');
    contentDiv.classList.add('message-content');
    contentDiv.textContent = text;

    const timestamp = document.createElement('div');
    timestamp.classList.add('message-timestamp');
    timestamp.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    messageDiv.appendChild(contentDiv);
    messageDiv.appendChild(timestamp);
    this.chatbotMessages.appendChild(messageDiv);

    // Scroll to bottom
    this.chatbotMessages.scrollTop = this.chatbotMessages.scrollHeight;
  }

  showTypingIndicator() {
    const typingDiv = document.createElement('div');
    typingDiv.classList.add('chatbot-message', 'bot-message');
    typingDiv.id = 'typing-indicator';

    const typingContent = document.createElement('div');
    typingContent.classList.add('typing-indicator');
    
    for (let i = 0; i < 3; i++) {
      const dot = document.createElement('div');
      dot.classList.add('typing-dot');
      typingContent.appendChild(dot);
    }

    typingDiv.appendChild(typingContent);
    this.chatbotMessages.appendChild(typingDiv);
    this.chatbotMessages.scrollTop = this.chatbotMessages.scrollHeight;
  }

  hideTypingIndicator() {
    const typingIndicator = document.getElementById('typing-indicator');
    if (typingIndicator) {
      typingIndicator.remove();
    }
  }

  generateResponse(message) {
    const lowerMessage = message.toLowerCase();
    
    // Check for specific keywords
    for (const [keyword, response] of Object.entries(this.responses)) {
      if (keyword !== 'default' && lowerMessage.includes(keyword)) {
        return response;
      }
    }

    // Special logic for chart numbers
    const chartMatch = lowerMessage.match(/chart\s*(\d)/);
    if (chartMatch) {
      const chartNum = chartMatch[1];
      const chartKey = `chart ${chartNum}`;
      return this.responses[chartKey] || `Chart ${chartNum} displays specific usage analytics. You can interact with it to get more detailed information about your Token Flex consumption.`;
    }

    // Check if asking about specific data that might be available
    if (lowerMessage.includes('current') || lowerMessage.includes('my data') || lowerMessage.includes('this month')) {
      return 'To see your current usage data, please select a contract from the dropdown menu at the top of the page. The charts will update to show your specific usage patterns for that contract.';
    }

    if (lowerMessage.includes('login') || lowerMessage.includes('authenticate')) {
      return 'You can log in using the Login button in the top-right corner. This will authenticate you with your Autodesk account to access your Token Flex data.';
    }

    if (lowerMessage.includes('refresh') || lowerMessage.includes('update')) {
      return 'To refresh your data, simply select a different contract from the dropdown or reload the page. The charts will automatically update with the latest usage information.';
    }

    // Return default response
    return this.responses.default;
  }
}

// Initialize chatbot when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new TokenFlexChatbot();
});