(function() {
  class ChatTooltip {
    constructor() {
      this.isRecording = false;
      this.isDragging = false;
      this.elements = {};
      this.settings = window.wcAgentSettings || {};
      this.dragOffset = { x: 0, y: 0 };
      this.init();
    }

    init() {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => this.setup());
      } else {
        this.setup();
      }
    }

    setup() {
      this.elements = {
        container: document.querySelector('.wc-agent-tooltip'),
        toggleButton: document.querySelector('.tooltip-button'),
        window: document.querySelector('.tooltip-window'),
        header: document.querySelector('.tooltip-header'),
        closeButton: document.querySelector('#close-chat'),
        minimizeButton: document.querySelector('#minimize-chat'),
        messagesContainer: document.querySelector('.messages-container'),
        input: document.querySelector('.message-input'),
        sendButton: document.querySelector('.send-button'),
        voiceButton: document.querySelector('#voice-toggle'),
        typingIndicator: document.querySelector('.typing-indicator'),
        voiceIndicator: document.querySelector('.voice-indicator'),
        agentStatus: document.querySelector('#agent-status')
      };

      if (this.elements.container) {
        this.bindEvents();
        this.setupDraggable();
      }
    }

    bindEvents() {
      // Toggle events
      this.elements.toggleButton?.addEventListener('click', () => this.toggleWindow());
      this.elements.closeButton?.addEventListener('click', () => this.closeWindow());
      this.elements.minimizeButton?.addEventListener('click', () => this.minimizeWindow());

      // Chat events
      this.elements.input?.addEventListener('keypress', (e) => this.handleKeyPress(e));
      this.elements.sendButton?.addEventListener('click', () => this.sendMessage());

      // Voice events
      if (this.settings.enable_voice) {
        this.elements.voiceButton?.addEventListener('click', () => this.toggleVoiceChat());
      } else if (this.elements.voiceButton) {
        this.elements.voiceButton.style.display = 'none';
      }
    }

    setupDraggable() {
      if (!this.settings.enable_drag) return;

      this.elements.header?.addEventListener('mousedown', (e) => this.startDragging(e));
      document.addEventListener('mousemove', (e) => this.drag(e));
      document.addEventListener('mouseup', () => this.stopDragging());
    }

    startDragging(e) {
      if (!this.settings.enable_drag) return;

      this.isDragging = true;
      const windowRect = this.elements.window.getBoundingClientRect();
      this.dragOffset = {
        x: e.clientX - windowRect.left,
        y: e.clientY - windowRect.top
      };

      this.elements.window.style.transition = 'none';
    }

    drag(e) {
      if (!this.isDragging) return;

      const x = e.clientX - this.dragOffset.x;
      const y = e.clientY - this.dragOffset.y;

      this.elements.window.style.left = `${x}px`;
      this.elements.window.style.top = `${y}px`;
    }

    stopDragging() {
      this.isDragging = false;
      this.elements.window.style.transition = '';
    }

    toggleWindow() {
      this.elements.window.classList.toggle('active');
      if (this.elements.window.classList.contains('active')) {
        this.showTypingIndicator();
      }
    }

    minimizeWindow() {
      this.elements.window.classList.remove('active');
    }

    closeWindow() {
      this.elements.window.classList.remove('active');
    }

    showTypingIndicator() {
      this.elements.typingIndicator.classList.add('active');
      setTimeout(() => {
        this.elements.typingIndicator.classList.remove('active');
        this.addMessage(this.settings.welcome_message || 'Hi there! How can I help you today?', false);
      }, 1500);
    }

    addMessage(content, isUser = false) {
      const messageDiv = document.createElement('div');
      messageDiv.className = `message ${isUser ? 'user-message' : 'agent-message'}`;

      const contentDiv = document.createElement('div');
      contentDiv.className = 'message-content';
      contentDiv.textContent = content;

      const timeDiv = document.createElement('div');
      timeDiv.className = 'message-time';
      timeDiv.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      messageDiv.appendChild(contentDiv);
      messageDiv.appendChild(timeDiv);

      this.elements.messagesContainer.appendChild(messageDiv);
      this.scrollToBottom();
    }

    scrollToBottom() {
      this.elements.messagesContainer.scrollTop = this.elements.messagesContainer.scrollHeight;
    }

    async sendMessage() {
      const message = this.elements.input.value.trim();
      if (!message) return;

      this.addMessage(message, true);
      this.elements.input.value = '';
      this.elements.input.focus();

      // Simulate typing response
      this.elements.typingIndicator.classList.add('active');
      await new Promise(resolve => setTimeout(resolve, 1500));
      this.elements.typingIndicator.classList.remove('active');
      this.addMessage('Thanks for your message! Our team will get back to you soon.');
    }

    handleKeyPress(e) {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.sendMessage();
      }
    }

    async toggleVoiceChat() {
      if (!this.isRecording) {
        try {
          if (!navigator.mediaDevices?.getUserMedia) {
            throw new Error('Voice chat is not supported in your browser');
          }

          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          this.startRecording(stream);
        } catch (err) {
          console.error('Microphone access error:', err);
          this.addMessage('Unable to access microphone. Please check your browser settings.', false);
        }
      } else {
        this.stopRecording();
      }
    }

    startRecording(stream) {
      this.isRecording = true;
      this.elements.voiceIndicator.classList.add('active');
      this.elements.voiceButton.classList.add('active');
    }

    stopRecording() {
      this.isRecording = false;
      this.elements.voiceIndicator.classList.remove('active');
      this.elements.voiceButton.classList.remove('active');
    }
  }

  // Initialize settings from the window object
  window.wcAgentSettings = {
    "enable_voice": {{ settings.enable_voice | json }},
    "enable_drag": {{ settings.enable_drag | json }},
    "welcome_message": {{ settings.welcome_message | json }},
    "default_mode": {{ settings.default_mode | json }}
  };

  // Initialize the chat tooltip
  new ChatTooltip();
})();