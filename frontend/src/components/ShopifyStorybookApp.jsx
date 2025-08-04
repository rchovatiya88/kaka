import React, { useState, useEffect } from 'react';

// Import components (we'll create these next)
import ThemeSelector from './ThemeSelector';
import StoryForm from './StoryForm';
import StoryPreview from './StoryPreview';
import ProductCheckout from './ProductCheckout';
import LoadingScreen from './LoadingScreen';
import ErrorScreen from './ErrorScreen';

export default function ShopifyStorybookApp({ config }) {
  const [currentStep, setCurrentStep] = useState('theme-selection');
  const [selectedTheme, setSelectedTheme] = useState(null);
  const [storyData, setStoryData] = useState({});
  const [generatedStory, setGeneratedStory] = useState(null);
  const [productId, setProductId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Initialize component
  useEffect(() => {
    console.log('🎯 ShopifyStorybookApp initialized with config:', config);
  }, []);

  // Progress steps for visual indicator
  const steps = [
    { id: 'theme-selection', label: 'Choose Theme', completed: false },
    { id: 'story-form', label: 'Customize Story', completed: false },
    { id: 'preview', label: 'Preview', completed: false },
    { id: 'checkout', label: 'Get Your Book', completed: false }
  ];

  // Update step completion status
  const getStepStatus = (stepId) => {
    const stepIndex = steps.findIndex(s => s.id === stepId);
    const currentIndex = steps.findIndex(s => s.id === currentStep);
    
    if (stepIndex < currentIndex) return 'completed';
    if (stepIndex === currentIndex) return 'active';
    return 'pending';
  };

  // Handlers
  const handleThemeSelect = (theme) => {
    console.log('🎨 Theme selected:', theme);
    setSelectedTheme(theme);
    setStoryData({ ...storyData, theme: theme.id });
    setCurrentStep('story-form');
    setError(null);
  };

  const handleFormSubmit = async (formData) => {
    console.log('📝 Form submitted:', formData);
    setStoryData({ ...storyData, ...formData });
    setCurrentStep('generating');
    setIsLoading(true);
    setError(null);
    
    try {
      // Call story generation API
      const response = await fetch(`${config.apiEndpoint}/generate-story`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...storyData,
          ...formData,
          shopDomain: config.shopDomain,
          customerId: config.customerId
        }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        setGeneratedStory(result.story);
        setCurrentStep('preview');
      } else {
        throw new Error(result.error || 'Failed to generate story');
      }
    } catch (err) {
      console.error('❌ Story generation failed:', err);
      setError({
        message: err.message,
        type: 'generation',
        canRetry: true
      });
      setCurrentStep('story-form');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateProduct = async () => {
    console.log('🛍️ Creating product for story:', generatedStory?.id);
    setCurrentStep('creating-product');
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${config.apiEndpoint}/create-product`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          storyId: generatedStory.id,
          title: `${storyData.childName}'s ${selectedTheme.name} Adventure`,
          storyData,
          customerId: config.customerId
        }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        setProductId(result.productId);
        setCurrentStep('checkout');
      } else {
        throw new Error(result.error || 'Failed to create product');
      }
    } catch (err) {
      console.error('❌ Product creation failed:', err);
      setError({
        message: err.message,
        type: 'product',
        canRetry: true
      });
      setCurrentStep('preview');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackStep = () => {
    setError(null);
    switch (currentStep) {
      case 'story-form':
        setCurrentStep('theme-selection');
        break;
      case 'preview':
        setCurrentStep('story-form');
        break;
      case 'checkout':
        setCurrentStep('preview');
        break;
      default:
        setCurrentStep('theme-selection');
    }
  };

  const handleRetry = () => {
    setError(null);
    if (error?.type === 'generation') {
      handleFormSubmit(storyData);
    } else if (error?.type === 'product') {
      handleCreateProduct();
    }
  };

  const handleStartOver = () => {
    setCurrentStep('theme-selection');
    setSelectedTheme(null);
    setStoryData({});
    setGeneratedStory(null);
    setProductId(null);
    setError(null);
    setIsLoading(false);
  };

  // Render current step
  const renderCurrentStep = () => {
    if (isLoading || currentStep === 'generating' || currentStep === 'creating-product') {
      return (
        <LoadingScreen 
          message={
            currentStep === 'generating' 
              ? 'Creating your magical story...' 
              : 'Preparing your storybook product...'
          }
        />
      );
    }

    if (error) {
      return (
        <ErrorScreen 
          error={error}
          onRetry={error.canRetry ? handleRetry : null}
          onStartOver={handleStartOver}
        />
      );
    }

    switch (currentStep) {
      case 'theme-selection':
        return (
          <ThemeSelector 
            onSelect={handleThemeSelect}
            config={config}
          />
        );
        
      case 'story-form':
        return (
          <StoryForm 
            theme={selectedTheme}
            onSubmit={handleFormSubmit}
            onBack={handleBackStep}
            initialData={storyData}
            config={config}
          />
        );
        
      case 'preview':
        return (
          <StoryPreview 
            story={generatedStory}
            theme={selectedTheme}
            storyData={storyData}
            onCreateProduct={handleCreateProduct}
            onBack={handleBackStep}
            config={config}
          />
        );
        
      case 'checkout':
        return (
          <ProductCheckout 
            productId={productId}
            story={generatedStory}
            onBack={handleBackStep}
            onStartOver={handleStartOver}
            config={config}
          />
        );
        
      default:
        return (
          <ErrorScreen 
            error={{ message: 'Unknown step: ' + currentStep, type: 'system', canRetry: false }}
            onStartOver={handleStartOver}
          />
        );
    }
  };

  return (
    <div className="shopify-storybook-app">
      {/* Progress Indicator */}
      <div className="progress-indicator">
        {steps.map((step, index) => (
          <div 
            key={step.id}
            className={`progress-step ${getStepStatus(step.id)}`}
          >
            <div className="step-number">{index + 1}</div>
            <div className="step-label">{step.label}</div>
            {index < steps.length - 1 && <div className="step-connector" />}
          </div>
        ))}
      </div>

      {/* Main Content */}
      <div className="step-content">
        {renderCurrentStep()}
      </div>

      {/* Debug Info (only in development) */}
      {config.debug && (
        <div className="debug-panel">
          <h4>Debug Info</h4>
          <pre>{JSON.stringify({ 
            currentStep, 
            selectedTheme: selectedTheme?.id, 
            hasStoryData: !!Object.keys(storyData).length,
            hasGeneratedStory: !!generatedStory,
            productId,
            isLoading,
            error: error?.type
          }, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
