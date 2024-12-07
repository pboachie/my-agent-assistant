class WCAgentTooltip {
  constructor() {
    this.isOpen = false;
    this.isDragging = false;
    this.hasShownWelcomeMessage = false;

    // Get settings from data attribute as fallback
    const tooltipElement = document.querySelector('.wc-agent-tooltip');
    const dataSettings = tooltipElement ? JSON.parse(tooltipElement.dataset.settings || '{}') : {};

    // Initialize settings from window.wcAgentSettings
    this.settings = {
      ...dataSettings,
      ...window.wcAgentSettings,
      // Color Scheme
      primary_color: window.wcAgentSettings?.primary_color || '#242833',
      secondary_color: window.wcAgentSettings?.secondary_color || '#F8F9FA',
      text_color: window.wcAgentSettings?.text_color || '#1A1A1A',
      message_color: window.wcAgentSettings?.message_color || '#FFFFFF',

      // Typography
      font_family: window.wcAgentSettings?.font_family || 'system',
      base_font_size: window.wcAgentSettings?.base_font_size || 14,
      font_weight: window.wcAgentSettings?.font_weight || '400',

      // Button & Bubble Styles
      button_style: window.wcAgentSettings?.button_style || 'rounded',
      button_size: window.wcAgentSettings?.button_size || 44,
      message_bubble_style: window.wcAgentSettings?.message_bubble_style || 'modern',
      bubble_radius: window.wcAgentSettings?.bubble_radius || 16,

      // Window Size
      window_width: window.wcAgentSettings?.window_width || 380,
      window_height: window.wcAgentSettings?.window_height || 520,
      window_position: window.wcAgentSettings?.window_position || 'bottom-right',

      // Agent Settings
      agent_name: window.wcAgentSettings?.agent_name || 'Agent',
      agent_avatar: window.wcAgentSettings?.agent_avatar || null,
      welcome_message: window.wcAgentSettings?.welcome_message || "Hi there! How can I help you today?",

      // Interactive Features
      enable_voice: window.wcAgentSettings?.enable_voice || false,
      enable_drag: window.wcAgentSettings?.enable_drag || false,
      voice_welcome_message: window.wcAgentSettings?.voice_welcome_message || "Hello, how can I help you today?",
      button_text: window.wcAgentSettings?.button_text || 'Speak to an Agent',
      input_placeholder: window.wcAgentSettings?.input_placeholder || 'Type your message...'
    };

    this.initializeElements();
    this.applySettings();
    this.init();
  }

  initializeElements() {
    this.tooltip = document.querySelector('.wc-agent-tooltip');
    this.button = document.querySelector('.tooltip-button');
    this.window = document.querySelector('.tooltip-window');
    this.closeBtn = document.querySelector('#close-chat');
    this.minimizeBtn = document.querySelector('#minimize-chat');
    this.messageInput = document.querySelector('#message-input');
    this.sendButton = document.querySelector('#send-button');
    this.messagesContainer = document.querySelector('#messages-container');
    this.agentNameElement = document.querySelector('.agent-name');
    this.agentAvatarElement = document.querySelector('.agent-avatar');
    this.avatarPlaceholder = document.querySelector('.avatar-placeholder');
  }

  initializeEventListeners() {
    // Toggle tooltip
    if (this.button) {
      this.button.addEventListener('click', () => this.toggleTooltip());
    }

    // Close button
    if (this.closeBtn) {
      this.closeBtn.addEventListener('click', () => {
        this.isOpen = false;
        this.window.style.display = 'none';
        this.button.classList.remove('active');
      });
    }

    // Minimize button
    if (this.minimizeBtn) {
      this.minimizeBtn.addEventListener('click', () => {
        this.isOpen = false;
        this.window.style.display = 'none';
        this.button.classList.remove('active');
      });
    }

    // Send message button
    if (this.sendButton) {
      this.sendButton.addEventListener('click', () => {
        const text = this.messageInput.value.trim();
        if (text) {
          this.addMessage(text, 'user');
          this.messageInput.value = '';
          this.messageInput.focus();

          // Simulate agent typing
          this.showTypingIndicator();
          setTimeout(() => {
            this.hideTypingIndicator();
            this.simulateAgentResponse();
          }, 1500);
        }
      });
    }

    // Handle input keypress (Enter to send)
    if (this.messageInput) {
      this.messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          this.sendButton.click();
        }
      });
    }

    // Voice toggle if enabled
    const voiceToggle = document.querySelector('#voice-toggle');
    if (voiceToggle && this.settings.enable_voice) {
      voiceToggle.addEventListener('click', () => {
        const voiceIndicator = this.tooltip.querySelector('.voice-indicator');
        if (voiceIndicator) {
          voiceIndicator.style.display = voiceIndicator.style.display === 'none' ? 'flex' : 'none';
        }
      });
    }
  }


  init() {
    // Initialize event listeners
    this.initializeEventListeners();

    // Initialize draggable if enabled
    if (this.settings.enable_drag) {
      this.initializeDraggable();
    }
  }

  applySettings() {
    if (!this.tooltip) return;

    const cssProps = {
      '--primary-color': this.settings.primary_color || '#121212',
      '--secondary-color': this.settings.secondary_color || '#F8F9FA',
      '--text-color': this.settings.text_color || '#1A1A1A',
      '--message-color': this.settings.message_color || '#FFFFFF',
      '--font-family': this.getFontFamily(),
      '--base-font-size': `${this.settings.base_font_size || 14}px`,
      '--font-weight': this.settings.font_weight || '400',
      '--button-size': `${this.settings.button_size || 44}px`,
      '--window-width': `${this.settings.window_width || 380}px`,
      '--window-height': `${this.settings.window_height || 520}px`,
      '--bubble-radius': `${this.settings.bubble_radius || 16}px`
    };

    Object.entries(cssProps).forEach(([prop, value]) => {
      if (value) this.tooltip.style.setProperty(prop, value);
    });

    // Apply other settings
    this.tooltip.className = `wc-agent-tooltip position-${this.settings.window_position}`;
    if (this.button) {
      this.button.className = `tooltip-button ${this.settings.button_style}`;
    }

    const positions = ['bottom-right', 'bottom-left', 'top-right', 'top-left'];
    positions.forEach(pos => this.tooltip.classList.remove(`position-${pos}`));
    this.tooltip.classList.add(`position-${this.settings.window_position || 'bottom-right'}`);

    // Apply message bubble style
    if (this.messagesContainer) {
      this.messagesContainer.className = `messages-container ${this.settings.message_bubble_style}`;
    }

    // Update text content
    if (this.agentNameElement) {
      this.agentNameElement.textContent = this.settings.agent_name;
    }
    if (this.messageInput) {
      this.messageInput.placeholder = this.settings.input_placeholder;
    }

    // Update agent avatar
    this.updateAgentAvatar();
    if (this.agentNameElement) {
      this.agentNameElement.textContent = this.settings.agent_name;
    }
  }

  getFontFamily() {
    const fontMap = {
      'system': 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif',
      'helvetica': '"Helvetica Neue", Helvetica, Arial, sans-serif',
      'roboto': 'Roboto, sans-serif',
      'inter': 'Inter, sans-serif',
      'arial': 'Arial, sans-serif'
    };
    return fontMap[this.settings.font_family] || fontMap.system;
  }

  updateAgentAvatar() {
    if (!this.agentAvatarElement || !this.avatarPlaceholder) return;

    if (this.settings.agent_avatar) {
      this.agentAvatarElement.src = this.settings.agent_avatar;
      this.agentAvatarElement.style.display = 'block';
      this.avatarPlaceholder.style.display = 'none';
    } else {
      this.agentAvatarElement.style.display = 'none';
      this.avatarPlaceholder.textContent = this.settings.agent_name.charAt(0).toUpperCase();
      this.avatarPlaceholder.style.display = 'flex';
    }
  }


  toggleTooltip() {
    if (this.isDragging) return;

    this.isOpen = !this.isOpen;

    // Ensure proper display handling
    if (this.window) {
      // Remove existing display style
      this.window.style.removeProperty('display');
      // Add/remove active class instead of setting display directly
      this.window.classList.toggle('active', this.isOpen);
      this.window.style.display = this.isOpen ? 'flex' : 'none';
    }

    if (this.button) {
      this.button.className = `tooltip-button ${this.settings.button_style || 'rounded'}`;
    }

    // Show welcome message only on first open
    if (this.isOpen && !this.hasShownWelcomeMessage) {
      this.showWelcomeMessage();
      this.hasShownWelcomeMessage = true;
    }

    // Focus input when opening
    if (this.isOpen && this.messageInput) {
      this.messageInput.focus();
    }
  }

  showWelcomeMessage() {
    // Add typing indicator
    this.showTypingIndicator();

    // Simulate agent typing welcome message
    setTimeout(() => {
      this.hideTypingIndicator();
      this.addMessage(this.settings.welcome_message, 'agent');

      // If voice is enabled, show voice welcome message after text
      if (this.settings.enable_voice) {
        setTimeout(() => {
          const voiceStatusElement = this.tooltip.querySelector('.voice-status');
          if (voiceStatusElement) {
            voiceStatusElement.textContent = this.settings.voice_welcome_message;
            voiceStatusElement.parentElement.style.display = 'flex';
          }
        }, 500);
      }
    }, 1000);
  }

  addMessage(text, sender) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message', sender);
    messageDiv.textContent = text;
    this.messagesContainer.appendChild(messageDiv);
    this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
  }

  showTypingIndicator() {
    const indicator = this.tooltip.querySelector('.typing-indicator');
    if (indicator) {
      indicator.style.display = 'flex';
    }
  }

  hideTypingIndicator() {
    const indicator = this.tooltip.querySelector('.typing-indicator');
    if (indicator) {
      indicator.style.display = 'none';
    }
  }

  simulateAgentResponse() {
    const responses = [
      "I understand. How can I help you with that?",
      "Thanks for sharing. Let me assist you with this.",
      "I'm here to help. Could you provide more details?",
      "I'll be happy to help you with that."
    ];
    const response = responses[Math.floor(Math.random() * responses.length)];
    this.addMessage(response, 'agent');
  }

  initializeDraggable() {
    if (!this.settings.enable_drag) return;

    let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
    const header = this.tooltip.querySelector('.tooltip-header');

    const dragMouseDown = (e) => {
      e.preventDefault();
      pos3 = e.clientX;
      pos4 = e.clientY;
      this.isDragging = true;

      document.addEventListener('mousemove', elementDrag);
      document.addEventListener('mouseup', closeDragElement);
    };

    const elementDrag = (e) => {
      e.preventDefault();
      pos1 = pos3 - e.clientX;
      pos2 = pos4 - e.clientY;
      pos3 = e.clientX;
      pos4 = e.clientY;

      const tooltip = this.tooltip;
      tooltip.style.top = `${tooltip.offsetTop - pos2}px`;
      tooltip.style.left = `${tooltip.offsetLeft - pos1}px`;
    };

    const closeDragElement = () => {
      this.isDragging = false;
      document.removeEventListener('mousemove', elementDrag);
      document.removeEventListener('mouseup', closeDragElement);
    };

    if (header) {
      header.addEventListener('mousedown', dragMouseDown);
    }
  }
}


// Initialize tooltip when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.wcTooltip = new WCAgentTooltip();
});
