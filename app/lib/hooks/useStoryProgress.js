/**
 * Custom hook for tracking story generation progress
 * Provides real-time progress updates during story creation
 */

import { useState, useCallback } from 'react';

export const useStoryProgress = () => {
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [estimatedTime, setEstimatedTime] = useState(0);

  /**
   * Start progress tracking
   */
  const startProgress = useCallback(() => {
    setProgress(0);
    setCurrentStep('Initializing story generation...');
    setIsGenerating(true);
    setEstimatedTime(60); // 60 seconds estimate
  }, []);

  /**
   * Update progress with specific step
   */
  const updateProgress = useCallback((newProgress, step, timeRemaining = null) => {
    setProgress(Math.min(newProgress, 100));
    setCurrentStep(step);
    if (timeRemaining !== null) {
      setEstimatedTime(timeRemaining);
    }
  }, []);

  /**
   * Complete progress tracking
   */
  const completeProgress = useCallback(() => {
    setProgress(100);
    setCurrentStep('Story generation complete!');
    setIsGenerating(false);
    setEstimatedTime(0);
  }, []);

  /**
   * Reset progress tracking
   */
  const resetProgress = useCallback(() => {
    setProgress(0);
    setCurrentStep('');
    setIsGenerating(false);
    setEstimatedTime(0);
  }, []);

  /**
   * Simulate progress for story generation steps
   */
  const simulateStoryProgress = useCallback(async (onComplete) => {
    const steps = [
      { progress: 10, step: 'Analyzing character details...', time: 55 },
      { progress: 25, step: 'Creating story outline...', time: 45 },
      { progress: 40, step: 'Generating story content...', time: 35 },
      { progress: 60, step: 'Creating illustrations...', time: 25 },
      { progress: 80, step: 'Adding final touches...', time: 10 },
      { progress: 95, step: 'Preparing your story...', time: 2 },
    ];

    for (const stepData of steps) {
      updateProgress(stepData.progress, stepData.step, stepData.time);
      // Wait for a realistic amount of time
      await new Promise(resolve => setTimeout(resolve, 8000));
    }

    completeProgress();
    if (onComplete) {
      onComplete();
    }
  }, [updateProgress, completeProgress]);

  return {
    progress,
    currentStep,
    isGenerating,
    estimatedTime,
    startProgress,
    updateProgress,
    completeProgress,
    resetProgress,
    simulateStoryProgress,
  };
};