(function() {
  if (window.WCAgentTooltipLoaded) return;
  window.WCAgentTooltipLoaded = true;

  class WCAgentTooltip {
    constructor() {
      this.isOpen = false;
      this.isDragging = false;
      this.hasShownWelcomeMessage = false;

      // Get settings directly from the manager
      this.settingsManager = window.wcAgentSettings;
      this.settings = this.settingsManager.getAll();

      this.initializeElements();
      this.applySettings();
      this.init();
    }

    updateSettings(newSettings) {
      this.settings = {
        ...this.settings,
        ...newSettings
      };
      this.applySettings();
    };

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
      let isDragging = false;
      const header = this.tooltip.querySelector('.tooltip-header');
      const tooltip = this.tooltip;
      const chatWindow = this.window;
      const tooltipButton = this.button;

      const setPosition = (top, left) => {
        const position = this.settings.window_position || 'bottom-right';
        const tooltipRect = tooltip.getBoundingClientRect();
        const chatRect = chatWindow.getBoundingClientRect();

        // Constrain to viewport
        left = Math.max(0, Math.min(left, window.innerWidth - tooltipRect.width));
        top = Math.max(0, Math.min(top, window.innerHeight - tooltipRect.height));

        // Calculate chat window position relative to tooltip
        let chatTop, chatLeft;

        if (position.includes('bottom')) {
          chatTop = top - chatRect.height - 16; // 16px gap
        } else {
          chatTop = top + tooltipRect.height + 16;
        }

        if (position.includes('right')) {
          chatLeft = left + tooltipRect.width - chatRect.width;
        } else {
          chatLeft = left;
        }

        // Constrain chat window to viewport
        chatLeft = Math.max(0, Math.min(chatLeft, window.innerWidth - chatRect.width));
        chatTop = Math.max(0, Math.min(chatTop, window.innerHeight - chatRect.height));

        // Apply positions
        tooltip.style.position = 'fixed';
        tooltip.style.left = `${left}px`;
        tooltip.style.top = `${top}px`;
        tooltip.style.right = 'auto';
        tooltip.style.bottom = 'auto';

        chatWindow.style.position = 'fixed';
        chatWindow.style.left = `${chatLeft}px`;
        chatWindow.style.top = `${chatTop}px`;
        chatWindow.style.right = 'auto';
        chatWindow.style.bottom = 'auto';
      };

      const startDrag = (e) => {
        // Don't start drag if clicking send button or other interactive elements
        if (e.target.closest('.send-button, .control-button, .message-input')) {
          return;
        }

        e.preventDefault();
        pos3 = e.clientX;
        pos4 = e.clientY;
        isDragging = true;

        document.addEventListener('mousemove', elementDrag);
        document.addEventListener('mouseup', closeDragElement);
      };

      const elementDrag = (e) => {
        if (!isDragging) return;
        e.preventDefault();

        pos1 = pos3 - e.clientX;
        pos2 = pos4 - e.clientY;
        pos3 = e.clientX;
        pos4 = e.clientY;

        const rect = tooltip.getBoundingClientRect();
        const newTop = rect.top - pos2;
        const newLeft = rect.left - pos1;

        setPosition(newTop, newLeft);
      };

      const closeDragElement = () => {
        isDragging = false;
        document.removeEventListener('mousemove', elementDrag);
        document.removeEventListener('mouseup', closeDragElement);

        // Preserve the chat window display state
        if (this.isOpen) {
          chatWindow.style.display = 'flex';
        }
      };

      // Add drag handlers to both header and tooltip button
      if (header) {
        header.addEventListener('mousedown', startDrag);
      }
      if (tooltipButton) {
        tooltipButton.addEventListener('mousedown', (e) => {
          // Only allow drag with left mouse button and prevent interference with click event
          if (e.button === 0) {
            const dragTimeout = setTimeout(() => {
              startDrag(e);
            }, 100); // Small delay to differentiate between click and drag

            tooltipButton.addEventListener('mouseup', () => {
              clearTimeout(dragTimeout);
            }, { once: true });
          }
        });
      }

      // Prevent click event when dragging ends
      tooltipButton.addEventListener('click', (e) => {
        if (this.isDragging) {
          e.stopPropagation();
          e.preventDefault();
        }
      }, true);
    }
  }

  class WCAgentSettingsManager {
    constructor() {
      // Default settings
      this.defaults = {
        // Chat Settings
        enable_text_chat: true,
        enable_voice_chat: true,
        welcome_message: "Hi there! How can I help you today?",
        input_placeholder: "Type your message...",

        // Display Settings
        button_style: "rounded",
        window_position: "bottom-right",
        button_size: 44,
        window_width: 380,
        window_height: 520,

        // Colors
        primary_color: "#0055ff",
        secondary_color: "#f8f9fa",
        text_color: "#1a1a1a",
        message_color: "#ffffff",

        // Typography
        font_family: "system",
        base_font_size: 14,
        font_weight: "400",

        // Agent Settings
        agent_name: "Agent",
        agent_avatar: null
      };

      this.settings = this.initializeSettings();
    }

    initializeSettings() {
      // Get settings from different sources in order of priority
      const dataSettings = this.getDataAttributes();
      const liquidSettings = window.wcAgentLiquidSettings || {};
      const urlSettings = this.getUrlParameters();

      // Merge settings with proper precedence
      return {
        ...this.defaults,
        ...dataSettings,
        ...liquidSettings,
        ...urlSettings
      };
    }

    getDataAttributes() {
      const tooltip = document.querySelector('.wc-agent-tooltip');
      if (!tooltip) return {};

      try {
        return JSON.parse(tooltip.dataset.settings || '{}');
      } catch (e) {
        console.warn('Failed to parse data attributes:', e);
        return {};
      }
    }

    getUrlParameters() {
      const params = new URLSearchParams(window.location.search);
      const settings = {};

      // Map URL parameters to settings
      params.forEach((value, key) => {
        if (key.startsWith('wc_')) {
          const settingKey = key.replace('wc_', '');
          settings[settingKey] = this.parseValue(value);
        }
      });

      return settings;
    }

    parseValue(value) {
      // Handle boolean values
      if (value === 'true') return true;
      if (value === 'false') return false;

      // Handle numeric values
      if (!isNaN(value) && value.trim() !== '') {
        return Number(value);
      }

      return value;
    }

    get(key) {
      return this.settings[key];
    }

    getAll() {
      return { ...this.settings };
    }

    update(newSettings) {
      this.settings = {
        ...this.settings,
        ...newSettings
      };

      // Trigger settings update event
      const event = new CustomEvent('wcAgentSettingsUpdated', {
        detail: this.settings
      });
      document.dispatchEvent(event);

      return this.settings;
    }
  }

  // Initialize tooltip when DOM is loaded
  document.addEventListener('DOMContentLoaded', () => {
    if (!window.wcAgentSettings) {
      window.wcAgentSettings = new WCAgentSettingsManager();
    }

    if (!window.wcTooltip) {
      window.wcTooltip = new WCAgentTooltip();
    }

    // Listen for settings updates
    document.addEventListener('wcAgentSettingsUpdated', (event) => {
      if (window.wcTooltip) {
        window.wcTooltip.updateSettings(event.detail);
      }
    });
  });
})();