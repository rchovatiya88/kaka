import React from 'react';
import ReactDOM from 'react-dom/client';
import ShopifyStorybookApp from './components/ShopifyStorybookApp';
import './styles/shopify-integration.css';

// Global StorybookApp object for external initialization
window.StorybookApp = {
  init: (config) => {
    const { containerId, shopDomain, apiKey, mode = 'storefront' } = config;
    const container = document.getElementById(containerId);
    
    if (!container) {
      console.error('❌ Container not found:', containerId);
      return;
    }

    // Create React root and render app
    const root = ReactDOM.createRoot(container);
    root.render(
      React.createElement(ShopifyStorybookApp, {
        config: {
          shopDomain,
          apiKey,
          mode,
          ...config
        }
      })
    );
    
    console.log('🚀 Shopify Storybook App initialized in', mode, 'mode');
  }
};

// Initialize when DOM is ready (for storefront mode)
document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('storybook-app-root');
  const loadingElement = document.getElementById('storybook-loading');
  
  if (container && window.STORYBOOK_CONFIG) {
    // Hide loading spinner
    if (loadingElement) {
      loadingElement.style.display = 'none';
    }
    
    // Initialize for storefront
    window.StorybookApp.init({
      containerId: 'storybook-app-root',
      ...window.STORYBOOK_CONFIG
    });
  }
});

// Handle any uncaught errors
window.addEventListener('error', (event) => {
  console.error('🚨 Storybook App Error:', event.error);
  
  // Show user-friendly error message
  const container = document.getElementById('storybook-app-root');
  if (container) {
    container.innerHTML = `
      <div style="text-align: center; padding: 2rem; color: #ef4444;">
        <h3>Something went wrong</h3>
        <p>Please refresh the page and try again.</p>
        <button onclick="window.location.reload()" style="background: #6366f1; color: white; padding: 0.5rem 1rem; border: none; border-radius: 0.5rem; cursor: pointer;">
          Refresh Page
        </button>
      </div>
    `;
  }
});
