import React from 'react';

export default function ErrorScreen({ error, onRetry, onStartOver }) {
  const getErrorIcon = (type) => {
    switch (type) {
      case 'network': return '📡';
      case 'generation': return '🤖';
      case 'product': return '🛍️';
      case 'validation': return '📝';
      default: return '⚠️';
    }
  };

  const getErrorTitle = (type) => {
    switch (type) {
      case 'network': return 'Connection Problem';
      case 'generation': return 'Story Generation Issue';
      case 'product': return 'Product Creation Issue';
      case 'validation': return 'Form Validation Error';
      default: return 'Something Went Wrong';
    }
  };

  const getHelpfulTips = (type) => {
    switch (type) {
      case 'network': 
        return [
          'Check your internet connection',
          'Try refreshing the page',
          'Make sure your browser is up to date'
        ];
      case 'generation':
        return [
          'Our AI is working hard - this sometimes takes a moment',
          'Try simplifying your story requirements',
          'Check that all required fields are filled'
        ];
      case 'product':
        return [
          'Don\'t worry - your story was created successfully',
          'We just had trouble setting up the purchase',
          'You can try again or contact support'
        ];
      default:
        return [
          'This is usually temporary',
          'Try refreshing the page',
          'Contact support if the problem persists'
        ];
    }
  };

  return (
    <div className="error-screen">
      <div className="error-content">
        {/* Error Icon */}
        <div className="error-icon">
          <span className="error-emoji">{getErrorIcon(error.type)}</span>
        </div>

        {/* Error Title */}
        <h2 className="error-title">{getErrorTitle(error.type)}</h2>
        
        {/* Error Message */}
        <p className="error-message">{error.message}</p>

        {/* Helpful Tips */}
        <div className="error-tips">
          <h4>Here's what you can try:</h4>
          <ul>
            {getHelpfulTips(error.type).map((tip, index) => (
              <li key={index}>{tip}</li>
            ))}
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="error-actions">
          {onRetry && (
            <button 
              className="retry-btn primary-btn"
              onClick={onRetry}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M1 4v6h6M23 20v-6h-6"/>
                <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"/>
              </svg>
              Try Again
            </button>
          )}
          
          <button 
            className="start-over-btn secondary-btn"
            onClick={onStartOver}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <polyline points="9,22 9,12 15,12 15,22"/>
            </svg>
            Start Over
          </button>
        </div>

        {/* Support Contact */}
        <div className="error-support">
          <p>
            Still having trouble? 
            <a href="mailto:support@kakastorybooks.com" className="support-link">
              Contact our support team
            </a>
          </p>
        </div>

        {/* Error Details (for debugging) */}
        {process.env.NODE_ENV === 'development' && (
          <details className="error-details">
            <summary>Technical Details</summary>
            <pre>{JSON.stringify(error, null, 2)}</pre>
          </details>
        )}
      </div>
    </div>
  );
}
