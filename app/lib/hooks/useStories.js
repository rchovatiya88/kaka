/**
 * Custom hook for managing stories in Shopify app
 * Provides state management for story operations
 */

import { useState, useEffect, useCallback } from 'react';
import { storyService } from '../services/storyService';

export const useStories = () => {
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Fetch all stories
   */
  const fetchStories = useCallback(async (limit = 20) => {
    setLoading(true);
    setError(null);
    
    try {
      const fetchedStories = await storyService.getStories(limit);
      setStories(fetchedStories);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching stories:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Create a new story
   */
  const createStory = useCallback(async (formData) => {
    setLoading(true);
    setError(null);
    
    try {
      const newStory = await storyService.generateStory(formData);
      setStories(prev => [newStory, ...prev]);
      return newStory;
    } catch (err) {
      setError(err.message);
      console.error('Error creating story:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Update an existing story
   */
  const updateStory = useCallback(async (storyId, updates) => {
    setLoading(true);
    setError(null);
    
    try {
      const updatedStory = await storyService.updateStory(storyId, updates);
      setStories(prev => 
        prev.map(story => 
          story.id === storyId ? { ...story, ...updatedStory } : story
        )
      );
      return updatedStory;
    } catch (err) {
      setError(err.message);
      console.error('Error updating story:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Delete a story
   */
  const deleteStory = useCallback(async (storyId) => {
    setLoading(true);
    setError(null);
    
    try {
      await storyService.deleteStory(storyId);
      setStories(prev => prev.filter(story => story.id !== storyId));
    } catch (err) {
      setError(err.message);
      console.error('Error deleting story:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Get story by ID
   */
  const getStoryById = useCallback(async (storyId) => {
    setLoading(true);
    setError(null);
    
    try {
      const story = await storyService.getStoryById(storyId);
      return story;
    } catch (err) {
      setError(err.message);
      console.error('Error fetching story:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Load stories on mount
  useEffect(() => {
    fetchStories();
  }, [fetchStories]);

  return {
    stories,
    loading,
    error,
    fetchStories,
    createStory,
    updateStory,
    deleteStory,
    getStoryById,
    clearError,
  };
};