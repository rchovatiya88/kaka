import React from 'react';

const themes = [
  {
    id: 'enchanted-manga',
    name: 'Enchanted Manga Adventure',
    description: 'Magical anime-style adventures with mystical creatures and ancient powers',
    image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop',
    gradient: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
    features: ['Anime Characters', 'Magic Powers', 'Epic Quests', 'Colorful Art'],
    ageRange: '6-12 years'
  },
  {
    id: 'underwater-explorer',
    name: 'Underwater Explorer',
    description: 'Deep sea adventures with marine life, treasure hunts, and ocean mysteries',
    image: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=400&h=300&fit=crop',
    gradient: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
    features: ['Sea Creatures', 'Treasure Hunting', 'Underwater Cities', 'Ocean Magic'],
    ageRange: '4-10 years'
  },
  {
    id: 'space-adventure',
    name: 'Space Adventure',
    description: 'Cosmic journeys with aliens, distant planets, and galactic adventures',
    image: 'https://images.unsplash.com/photo-1446776653964-20c1d3a81b06?w=400&h=300&fit=crop',
    gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    features: ['Alien Friends', 'Space Ships', 'New Planets', 'Cosmic Powers'],
    ageRange: '5-12 years'
  },
  {
    id: 'world-explorer',
    name: 'World Explorer',
    description: 'Cultural adventures around the globe with diverse characters and traditions',
    image: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=400&h=300&fit=crop',
    gradient: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
    features: ['Global Cultures', 'Historical Sites', 'Local Friends', 'Real Adventures'],
    ageRange: '6-14 years'
  }
];

export default function ThemeSelector({ onSelect, config }) {
  const handleThemeSelect = (theme) => {
    // Add analytics tracking if available
    if (window.gtag) {
      window.gtag('event', 'theme_selected', {
        theme_id: theme.id,
        theme_name: theme.name,
        customer_id: config.customerId
      });
    }
    
    onSelect(theme);
  };

  return (
    <div className="theme-selector">
      <div className="hero-section">
        <h2 className="hero-title">Choose Your Adventure Theme</h2>
        <p className="hero-description">
          Select the perfect theme for your child's personalized storybook adventure. 
          Each story is uniquely crafted using AI to feature your child as the hero!
        </p>
      </div>

      <div className="themes-grid">
        {themes.map(theme => (
          <div 
            key={theme.id} 
            className="theme-card"
            style={{ background: theme.gradient }}
            onClick={() => handleThemeSelect(theme)}
          >
            <div className="theme-image-container">
              <img 
                src={theme.image} 
                alt={theme.name}
                className="theme-image"
                loading="lazy"
              />
              <div className="theme-overlay">
                <div className="age-badge">{theme.ageRange}</div>
              </div>
            </div>
            
            <div className="theme-content">
              <h3 className="theme-title">{theme.name}</h3>
              <p className="theme-description">{theme.description}</p>
              
              <div className="theme-features">
                {theme.features.map((feature, index) => (
                  <span key={index} className="feature-tag">
                    {feature}
                  </span>
                ))}
              </div>
              
              <button 
                className="theme-select-btn"
                aria-label={`Select ${theme.name} theme`}
              >
                <span>Choose This Adventure</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="theme-benefits">
        <div className="benefit-item">
          <div className="benefit-icon">🤖</div>
          <div className="benefit-text">
            <strong>AI-Powered Stories</strong>
            <span>Each story is uniquely generated using advanced AI technology</span>
          </div>
        </div>
        
        <div className="benefit-item">
          <div className="benefit-icon">🎨</div>
          <div className="benefit-text">
            <strong>Custom Illustrations</strong>
            <span>Beautiful artwork created specifically for your child's story</span>
          </div>
        </div>
        
        <div className="benefit-item">
          <div className="benefit-icon">📚</div>
          <div className="benefit-text">
            <strong>Professional Quality</strong>
            <span>High-quality PDF perfect for printing or digital reading</span>
          </div>
        </div>
        
        <div className="benefit-item">
          <div className="benefit-icon">⚡</div>
          <div className="benefit-text">
            <strong>Instant Delivery</strong>
            <span>Get your personalized storybook in minutes, not days</span>
          </div>
        </div>
      </div>

      {/* Customer testimonials or reviews could go here */}
      <div className="social-proof">
        <p className="testimonial">
          "My daughter absolutely loves her personalized storybook! The AI created such a unique adventure that perfectly captured her personality." 
          <strong>- Sarah M.</strong>
        </p>
      </div>
    </div>
  );
}
