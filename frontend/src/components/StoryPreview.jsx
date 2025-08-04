import React, { useEffect, useState } from 'react';

const StoryPreview = ({ 
  storyData, 
  onEdit, 
  onProceedToProduct, 
  isGenerating = false 
}) => {
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    if (storyData?.content && !isTyping) {
      setIsTyping(true);
      setDisplayedText('');
      
      // Typewriter effect
      let index = 0;
      const timer = setInterval(() => {
        if (index < storyData.content.length) {
          setDisplayedText(storyData.content.substring(0, index + 1));
          index++;
        } else {
          setIsTyping(false);
          clearInterval(timer);
        }
      }, 30);

      return () => clearInterval(timer);
    }
  }, [storyData?.content]);

  if (isGenerating) {
    return (
      <div className="story-preview generating">
        <div className="preview-header">
          <h2>🎭 Generating Your Story</h2>
          <p>Our AI is crafting your personalized adventure...</p>
        </div>
        
        <div className="generation-animation">
          <div className="magic-sparkles">
            <span>✨</span>
            <span>🌟</span>
            <span>⭐</span>
            <span>💫</span>
          </div>
          <div className="progress-text">
            <p>Creating characters...</p>
            <p>Building the world...</p>
            <p>Weaving the adventure...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!storyData) {
    return (
      <div className="story-preview empty">
        <div className="empty-state">
          <h2>📖 Story Preview</h2>
          <p>Complete the form to see your story come to life!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="story-preview">
      <div className="preview-header">
        <div className="story-meta">
          <h2>📖 {storyData.title}</h2>
          <div className="story-tags">
            <span className="theme-tag">{storyData.theme}</span>
            <span className="age-tag">Age {storyData.ageRange}</span>
          </div>
        </div>
        <div className="preview-actions">
          <button 
            onClick={onEdit}
            className="btn-secondary"
            type="button"
          >
            ✏️ Edit Story
          </button>
        </div>
      </div>

      <div className="story-content">
        <div className="story-cover">
          {storyData.coverImage ? (
            <img 
              src={storyData.coverImage} 
              alt={`${storyData.title} cover`}
              className="cover-image"
            />
          ) : (
            <div className="cover-placeholder">
              <span className="cover-emoji">{storyData.themeEmoji || '📚'}</span>
              <p>{storyData.title}</p>
            </div>
          )}
        </div>

        <div className="story-text">
          <div className="story-body">
            {displayedText && (
              <p className={`story-content-text ${isTyping ? 'typing' : ''}`}>
                {displayedText}
                {isTyping && <span className="cursor">|</span>}
              </p>
            )}
          </div>

          {storyData.characters && storyData.characters.length > 0 && (
            <div className="story-characters">
              <h3>Characters in your story:</h3>
              <div className="character-list">
                {storyData.characters.map((character, index) => (
                  <div key={index} className="character-card">
                    <span className="character-name">{character.name}</span>
                    <span className="character-role">{character.role}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {storyData.summary && (
            <div className="story-summary">
              <h3>Story Summary:</h3>
              <p>{storyData.summary}</p>
            </div>
          )}
        </div>
      </div>

      <div className="preview-footer">
        <div className="story-stats">
          <div className="stat">
            <span className="stat-label">Length:</span>
            <span className="stat-value">{storyData.content?.length || 0} characters</span>
          </div>
          <div className="stat">
            <span className="stat-label">Reading Time:</span>
            <span className="stat-value">~{Math.ceil((storyData.content?.length || 0) / 200)} min</span>
          </div>
        </div>

        <div className="next-actions">
          <button 
            onClick={onProceedToProduct}
            className="btn-primary large"
            disabled={!storyData.content || isTyping}
            type="button"
          >
            🛍️ Create Product & Buy Story
          </button>
        </div>
      </div>

      {/* Preview overlay for mobile */}
      <div className="mobile-preview-overlay">
        <p>Tap to view full story</p>
      </div>
    </div>
  );
};

export default StoryPreview;
