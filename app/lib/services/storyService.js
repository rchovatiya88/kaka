/**
 * Story Service for Shopify App
 * Adapted from kakafullstack for Remix architecture with Shopify authentication
 */

/**
 * Generate a complete story with Venice AI
 */
export const generateStory = async (formData, request) => {
  console.log('🚀 Starting story generation with form data:', formData);

  try {
    const payload = {
      character_name: formData.characterName,
      story_summary: formData.storyGuidance || 'adventure',
      theme: formData.theme || 'adventure',
      art_style: formData.artStyle || 'storybook',
      age_group: formData.ageGroup || '4-8',
      page_count: formData.pageCount || 5,
      language: formData.language || 'en',
      special_requests: formData.specialRequests
    };

    console.log('📦 Prepared payload:', payload);

    const response = await fetch('/api/v1/stories', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Story generation failed: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('✅ Story generation completed successfully');
    
    return data;
  } catch (error) {
    console.error('💥 Story generation failed:', error);
    throw error;
  }
};

/**
 * Get stories for current user/shop
 */
export const getStories = async (limit = 20) => {
  console.log('📚 Fetching user stories...');

  try {
    const response = await fetch(`/api/v1/stories?limit=${limit}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch stories: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('✅ Stories fetched successfully');
    return data.stories || [];
  } catch (error) {
    console.error('💥 Failed to fetch stories:', error);
    throw error;
  }
};

/**
 * Get story by ID
 */
export const getStoryById = async (storyId) => {
  console.log('📖 Fetching story by ID:', storyId);

  try {
    const response = await fetch(`/api/v1/stories/${storyId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch story: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('✅ Story fetched successfully');
    return data;
  } catch (error) {
    console.error('💥 Failed to fetch story:', error);
    throw error;
  }
};

/**
 * Update story
 */
export const updateStory = async (storyId, updates) => {
  console.log('📝 Updating story:', storyId, updates);

  try {
    const response = await fetch(`/api/v1/stories/${storyId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      throw new Error(`Failed to update story: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('✅ Story updated successfully');
    return data;
  } catch (error) {
    console.error('💥 Failed to update story:', error);
    throw error;
  }
};

/**
 * Delete story
 */
export const deleteStory = async (storyId) => {
  console.log('🗑️ Deleting story:', storyId);

  try {
    const response = await fetch(`/api/v1/stories/${storyId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to delete story: ${response.statusText}`);
    }

    console.log('✅ Story deleted successfully');
    return true;
  } catch (error) {
    console.error('💥 Failed to delete story:', error);
    throw error;
  }
};

/**
 * Upload character image
 */
export const uploadCharacterImage = async (imageFile, characterName, characterDescription) => {
  console.log('📸 Uploading character image:', characterName);

  try {
    const formData = new FormData();
    formData.append('image', imageFile);
    formData.append('character_name', characterName);
    
    if (characterDescription) {
      formData.append('description', JSON.stringify(characterDescription));
    }

    const response = await fetch('/api/v1/characters/upload', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Failed to upload character image: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('✅ Character image uploaded successfully');
    return data;
  } catch (error) {
    console.error('💥 Failed to upload character image:', error);
    throw error;
  }
};

/**
 * Edit story image
 */
export const editStoryImage = async (storyId, pageNumber, editPrompt) => {
  console.log('🎨 Editing story image:', storyId, 'page:', pageNumber);

  try {
    const response = await fetch(`/api/v1/stories/${storyId}/pages/${pageNumber}/image`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        edit_prompt: editPrompt
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to edit story image: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('✅ Story image edited successfully');
    return data;
  } catch (error) {
    console.error('💥 Failed to edit story image:', error);
    throw error;
  }
};

/**
 * Regenerate story image
 */
export const regenerateStoryImage = async (storyId, pageNumber) => {
  console.log('🔄 Regenerating story image:', storyId, 'page:', pageNumber);

  try {
    const response = await fetch(`/api/v1/stories/${storyId}/pages/${pageNumber}/regenerate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to regenerate story image: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('✅ Story image regenerated successfully');
    return data;
  } catch (error) {
    console.error('💥 Failed to regenerate story image:', error);
    throw error;
  }
};

const storyService = {
  generateStory,
  getStories,
  getStoryById,
  updateStory,
  deleteStory,
  uploadCharacterImage,
  editStoryImage,
  regenerateStoryImage,
};

export default storyService;