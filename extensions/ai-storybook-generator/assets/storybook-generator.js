// AI Storybook Generator Theme Extension JavaScript
(function() {
  'use strict';

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  function init() {
    const storybookBlocks = document.querySelectorAll('.storybook-generator-block');
    
    storybookBlocks.forEach(block => {
      initializeStorybookBlock(block);
    });
  }

  function initializeStorybookBlock(block) {
    const themeSelection = block.querySelector('#theme-selection');
    const appContainer = block.querySelector('#storybook-app');
    const iframe = block.querySelector('#storybook-iframe');
    const themeButtons = block.querySelectorAll('.theme-select-btn');
    const backButton = block.querySelector('#back-to-themes');
    const successMessage = block.querySelector('#storybook-success');
    const errorMessage = block.querySelector('#storybook-error');

    // Theme selection handlers
    themeButtons.forEach(button => {
      button.addEventListener('click', function(e) {
        e.preventDefault();
        
        const themeCard = this.closest('.theme-card');
        const theme = themeCard.dataset.theme;
        
        // Show loading state
        showLoadingState(this);
        
        // Build the embedded URL
        const appUrl = 'https://az-repeat-predict-canadian.trycloudflare.com';
        const embedUrl = `${appUrl}/app/create/${theme}?embedded=true&shop=${window.Shopify?.shop?.permanent_domain || 'demo'}&host=${window.location.host}`;
        
        // Hide theme selection and show app
        themeSelection.style.display = 'none';
        appContainer.style.display = 'block';
        
        // Load the iframe
        iframe.src = embedUrl;
        
        // Analytics tracking (if available)
        if (window.gtag) {
          window.gtag('event', 'theme_selected', {
            'theme_name': theme,
            'app_name': 'ai_storybook_generator'
          });
        }
        
        // Scroll to the app
        appContainer.scrollIntoView({ behavior: 'smooth' });
        
        // Reset loading state
        setTimeout(() => resetLoadingState(button), 1000);
      });
    });

    // Back to themes handler
    if (backButton) {
      backButton.addEventListener('click', function(e) {
        e.preventDefault();
        
        // Show theme selection and hide app
        themeSelection.style.display = 'grid';
        appContainer.style.display = 'none';
        iframe.src = '';
        
        // Hide messages
        hideMessages();
        
        // Scroll back to themes
        themeSelection.scrollIntoView({ behavior: 'smooth' });
        
        // Analytics tracking
        if (window.gtag) {
          window.gtag('event', 'back_to_themes', {
            'app_name': 'ai_storybook_generator'
          });
        }
      });
    }

    // Handle iframe messages
    window.addEventListener('message', function(event) {
      // Verify origin for security
      if (event.origin !== 'https://az-repeat-predict-canadian.trycloudflare.com') {
        return;
      }
      
      const data = event.data;
      
      switch (data.type) {
        case 'STORYBOOK_COMPLETE':
          showSuccessMessage();
          // Analytics tracking
          if (window.gtag) {
            window.gtag('event', 'storybook_completed', {
              'theme_name': data.theme,
              'app_name': 'ai_storybook_generator'
            });
          }
          break;
          
        case 'STORYBOOK_ERROR':
          showErrorMessage(data.message);
          break;
          
        case 'RESIZE_IFRAME':
          if (data.height) {
            iframe.style.height = data.height + 'px';
          }
          break;
          
        default:
          console.log('Unknown message type:', data.type);
      }
    });

    // Utility functions
    function showLoadingState(button) {
      const originalText = button.textContent;
      button.textContent = 'Loading...';
      button.disabled = true;
      button.classList.add('loading');
      
      // Store original text for restoration
      button.dataset.originalText = originalText;
    }

    function resetLoadingState(button) {
      button.textContent = button.dataset.originalText || 'Create Story';
      button.disabled = false;
      button.classList.remove('loading');
    }

    function showSuccessMessage() {
      hideMessages();
      successMessage.classList.add('show');
      
      // Auto-hide after 5 seconds
      setTimeout(() => {
        successMessage.classList.remove('show');
      }, 5000);
    }

    function showErrorMessage(message) {
      hideMessages();
      if (message) {
        errorMessage.textContent = message;
      }
      errorMessage.classList.add('show');
      
      // Auto-hide after 8 seconds
      setTimeout(() => {
        errorMessage.classList.remove('show');
      }, 8000);
    }

    function hideMessages() {
      successMessage.classList.remove('show');
      errorMessage.classList.remove('show');
    }
  }

  // Error handling for the entire script
  window.addEventListener('error', function(event) {
    console.error('Storybook Generator Error:', event.error);
    
    // Try to show error message if available
    const errorMessage = document.querySelector('.storybook-error-message');
    if (errorMessage) {
      errorMessage.textContent = 'Something went wrong. Please refresh and try again.';
      errorMessage.classList.add('show');
    }
  });

  // Expose for debugging (development only)
  if (window.location.hostname === 'localhost' || window.location.hostname.includes('trycloudflare')) {
    window.StorybookGenerator = {
      init: init,
      version: '1.0.0'
    };
  }
})();
