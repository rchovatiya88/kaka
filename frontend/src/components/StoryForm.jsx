import React, { useState, useEffect } from 'react';

export default function StoryForm({ theme, onSubmit, onBack, initialData = {}, config }) {
  const [formData, setFormData] = useState({
    childName: '',
    childAge: '',
    childGender: '',
    hobbies: '',
    skinTone: '',
    hairColor: '',
    hairStyle: '',
    eyeColor: '',
    specialRequests: '',
    ...initialData
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form validation
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.childName.trim()) {
      newErrors.childName = "Child's name is required";
    }
    
    if (!formData.childAge) {
      newErrors.childAge = "Please select an age";
    }
    
    if (formData.hobbies && formData.hobbies.length > 200) {
      newErrors.hobbies = "Please keep hobbies under 200 characters";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    // Add analytics tracking
    if (window.gtag) {
      window.gtag('event', 'story_form_submitted', {
        theme_id: theme.id,
        child_age: formData.childAge,
        customer_id: config.customerId
      });
    }
    
    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="story-form">
      <div className="form-header">
        <button 
          type="button"
          className="back-btn"
          onClick={onBack}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          Back to Themes
        </button>
        
        <div className="selected-theme-info">
          <h2>Customize Your {theme.name}</h2>
          <p>Tell us about your child to create a personalized adventure story</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="story-customization-form">
        {/* Child Information Section */}
        <div className="form-section">
          <h3 className="section-title">
            <span className="section-icon">👶</span>
            About Your Child
          </h3>
          
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="childName" className="form-label">
                Child's Name *
              </label>
              <input
                type="text"
                id="childName"
                value={formData.childName}
                onChange={(e) => handleInputChange('childName', e.target.value)}
                placeholder="Enter your child's name"
                className={`form-input ${errors.childName ? 'error' : ''}`}
                required
              />
              {errors.childName && <span className="error-message">{errors.childName}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="childAge" className="form-label">
                Age *
              </label>
              <select
                id="childAge"
                value={formData.childAge}
                onChange={(e) => handleInputChange('childAge', e.target.value)}
                className={`form-select ${errors.childAge ? 'error' : ''}`}
                required
              >
                <option value="">Select age</option>
                {[...Array(13)].map((_, i) => (
                  <option key={i + 3} value={i + 3}>
                    {i + 3} years old
                  </option>
                ))}
              </select>
              {errors.childAge && <span className="error-message">{errors.childAge}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="childGender" className="form-label">
                Gender (Optional)
              </label>
              <select
                id="childGender"
                value={formData.childGender}
                onChange={(e) => handleInputChange('childGender', e.target.value)}
                className="form-select"
              >
                <option value="">Prefer not to say</option>
                <option value="boy">Boy</option>
                <option value="girl">Girl</option>
                <option value="non-binary">Non-binary</option>
              </select>
            </div>
          </div>
        </div>

        {/* Character Appearance Section */}
        <div className="form-section">
          <h3 className="section-title">
            <span className="section-icon">🎨</span>
            Character Appearance
          </h3>
          <p className="section-description">
            Help us create artwork that looks like your child (all fields optional)
          </p>
          
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="skinTone" className="form-label">Skin Tone</label>
              <select
                id="skinTone"
                value={formData.skinTone}
                onChange={(e) => handleInputChange('skinTone', e.target.value)}
                className="form-select"
              >
                <option value="">Select skin tone</option>
                <option value="very-light">Very Light</option>
                <option value="light">Light</option>
                <option value="medium-light">Medium Light</option>
                <option value="medium">Medium</option>
                <option value="medium-dark">Medium Dark</option>
                <option value="dark">Dark</option>
                <option value="very-dark">Very Dark</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="hairColor" className="form-label">Hair Color</label>
              <select
                id="hairColor"
                value={formData.hairColor}
                onChange={(e) => handleInputChange('hairColor', e.target.value)}
                className="form-select"
              >
                <option value="">Select hair color</option>
                <option value="blonde">Blonde</option>
                <option value="brown">Brown</option>
                <option value="black">Black</option>
                <option value="red">Red/Auburn</option>
                <option value="gray">Gray</option>
                <option value="white">White</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="hairStyle" className="form-label">Hair Style</label>
              <select
                id="hairStyle"
                value={formData.hairStyle}
                onChange={(e) => handleInputChange('hairStyle', e.target.value)}
                className="form-select"
              >
                <option value="">Select hair style</option>
                <option value="short">Short</option>
                <option value="medium">Medium Length</option>
                <option value="long">Long</option>
                <option value="curly">Curly</option>
                <option value="wavy">Wavy</option>
                <option value="straight">Straight</option>
                <option value="braids">Braids</option>
                <option value="ponytail">Ponytail</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="eyeColor" className="form-label">Eye Color</label>
              <select
                id="eyeColor"
                value={formData.eyeColor}
                onChange={(e) => handleInputChange('eyeColor', e.target.value)}
                className="form-select"
              >
                <option value="">Select eye color</option>
                <option value="brown">Brown</option>
                <option value="blue">Blue</option>
                <option value="green">Green</option>
                <option value="hazel">Hazel</option>
                <option value="gray">Gray</option>
                <option value="amber">Amber</option>
              </select>
            </div>
          </div>
        </div>

        {/* Story Personalization Section */}
        <div className="form-section">
          <h3 className="section-title">
            <span className="section-icon">✨</span>
            Story Personalization
          </h3>
          
          <div className="form-group">
            <label htmlFor="hobbies" className="form-label">
              Hobbies & Interests
            </label>
            <textarea
              id="hobbies"
              value={formData.hobbies}
              onChange={(e) => handleInputChange('hobbies', e.target.value)}
              placeholder="What does your child love? (e.g., dinosaurs, soccer, painting, reading)"
              className={`form-textarea ${errors.hobbies ? 'error' : ''}`}
              rows="3"
              maxLength="200"
            />
            <div className="char-count">
              {formData.hobbies.length}/200 characters
            </div>
            {errors.hobbies && <span className="error-message">{errors.hobbies}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="specialRequests" className="form-label">
              Special Requests (Optional)
            </label>
            <textarea
              id="specialRequests"
              value={formData.specialRequests}
              onChange={(e) => handleInputChange('specialRequests', e.target.value)}
              placeholder="Any special elements you'd like in the story? Friends, pets, favorite places?"
              className="form-textarea"
              rows="2"
              maxLength="150"
            />
            <div className="char-count">
              {formData.specialRequests.length}/150 characters
            </div>
          </div>
        </div>

        {/* Story Preview Info */}
        <div className="story-preview-info">
          <h4>What You'll Get:</h4>
          <ul>
            <li>📖 A unique 8-12 page personalized story</li>
            <li>🎨 Custom illustrations featuring your child</li>
            <li>📱 Digital PDF perfect for any device</li>
            <li>🖨️ Print-ready format for physical books</li>
            <li>⚡ Delivered instantly after purchase</li>
          </ul>
        </div>

        {/* Form Actions */}
        <div className="form-actions">
          <button
            type="submit"
            className="generate-btn"
            disabled={isSubmitting || !formData.childName || !formData.childAge}
          >
            {isSubmitting ? (
              <>
                <div className="spinner"></div>
                Creating Your Story...
              </>
            ) : (
              <>
                Generate My Story
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
