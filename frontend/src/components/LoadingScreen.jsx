import React from 'react';

export default function LoadingScreen({ message = 'Loading...' }) {
  const loadingSteps = [
    'Preparing AI storyteller...',
    'Creating your unique adventure...',
    'Generating custom illustrations...',
    'Adding magical touches...',
    'Almost ready!'
  ];

  const [currentStep, setCurrentStep] = React.useState(0);

  React.useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStep(prev => (prev + 1) % loadingSteps.length);
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="loading-screen">
      <div className="loading-content">
        {/* Animated Loading Icon */}
        <div className="loading-animation">
          <div className="magic-wand">
            <span className="wand-emoji">🪄</span>
            <div className="sparkles">
              <span className="sparkle">✨</span>
              <span className="sparkle">⭐</span>
              <span className="sparkle">✨</span>
            </div>
          </div>
        </div>

        {/* Main Message */}
        <h2 className="loading-title">{message}</h2>
        
        {/* Current Step */}
        <p className="loading-step">{loadingSteps[currentStep]}</p>

        {/* Progress Bar */}
        <div className="progress-bar">
          <div className="progress-fill"></div>
        </div>

        {/* Fun Loading Messages */}
        <div className="loading-tips">
          <p>💡 <strong>Did you know?</strong> Each story is completely unique and created just for your child!</p>
        </div>

        {/* Estimated Time */}
        <div className="estimated-time">
          <small>This usually takes 30-60 seconds</small>
        </div>
      </div>
    </div>
  );
}
