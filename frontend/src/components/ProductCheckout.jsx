import React, { useState, useEffect } from 'react';

const ProductCheckout = ({ 
  storyData, 
  onBack, 
  onPurchaseComplete,
  isCreatingProduct = false 
}) => {
  const [productData, setProductData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [purchaseStatus, setPurchaseStatus] = useState('idle'); // idle, processing, success, error

  // Create Shopify product when component mounts
  useEffect(() => {
    if (storyData && !productData && !isCreatingProduct) {
      createShopifyProduct();
    }
  }, [storyData, isCreatingProduct]);

  const createShopifyProduct = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Call our API to create the product
      const response = await fetch('/api/create-story-product', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: storyData.title,
          description: storyData.summary || `A personalized ${storyData.theme} adventure story`,
          content: storyData.content,
          theme: storyData.theme,
          characters: storyData.characters,
          ageRange: storyData.ageRange,
          price: calculatePrice(storyData),
          tags: [
            'personalized-story',
            'ai-generated',
            storyData.theme.toLowerCase(),
            `age-${storyData.ageRange}`,
            'digital-product'
          ]
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create product');
      }

      const product = await response.json();
      setProductData(product);
      
      // Track product creation
      if (window.gtag) {
        window.gtag('event', 'product_created', {
          product_id: product.id,
          product_name: product.title,
          theme: storyData.theme,
          price: product.price
        });
      }

    } catch (err) {
      console.error('Error creating product:', err);
      setError('Failed to create your story product. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const calculatePrice = (story) => {
    let basePrice = 9.99;
    
    // Price adjustments based on story features
    if (story.content?.length > 2000) basePrice += 2.00;
    if (story.characters?.length > 2) basePrice += 1.00;
    if (story.theme === 'Space Adventure') basePrice += 1.00;
    
    return Math.round(basePrice * 100) / 100; // Round to 2 decimal places
  };

  const handlePurchase = async () => {
    if (!productData) return;

    setPurchaseStatus('processing');
    setError(null);

    try {
      // Add to cart and redirect to checkout
      const response = await fetch('/cart/add.js', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: productData.variant_id,
          quantity: 1
        })
      });

      if (!response.ok) {
        throw new Error('Failed to add to cart');
      }

      // Track purchase attempt
      if (window.gtag) {
        window.gtag('event', 'begin_checkout', {
          product_id: productData.id,
          product_name: productData.title,
          value: productData.price,
          currency: 'USD'
        });
      }

      // Redirect to checkout
      window.location.href = '/checkout';

    } catch (err) {
      console.error('Error during purchase:', err);
      setError('Failed to process purchase. Please try again.');
      setPurchaseStatus('error');
    }
  };

  const handleBuyNow = async () => {
    if (!productData) return;

    setPurchaseStatus('processing');
    
    try {
      // Create checkout session for immediate purchase
      const response = await fetch('/api/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          product_id: productData.id,
          variant_id: productData.variant_id,
          quantity: 1
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create checkout');
      }

      const { checkout_url } = await response.json();
      
      // Track purchase
      if (window.gtag) {
        window.gtag('event', 'purchase_initiated', {
          product_id: productData.id,
          checkout_url: checkout_url
        });
      }

      // Redirect to Shopify checkout
      window.location.href = checkout_url;

    } catch (err) {
      console.error('Error creating checkout:', err);
      setError('Failed to create checkout. Please try again.');
      setPurchaseStatus('error');
    }
  };

  if (isCreatingProduct || isLoading) {
    return (
      <div className="product-checkout loading">
        <div className="checkout-header">
          <h2>🛍️ Creating Your Story Product</h2>
          <p>Setting up your personalized storybook for purchase...</p>
        </div>
        
        <div className="product-creation-animation">
          <div className="creation-steps">
            <div className="step active">
              <span className="step-icon">📖</span>
              <span className="step-text">Preparing story content</span>
            </div>
            <div className="step active">
              <span className="step-icon">🎨</span>
              <span className="step-text">Generating cover art</span>
            </div>
            <div className="step active">
              <span className="step-icon">🛍️</span>
              <span className="step-text">Creating product listing</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="product-checkout error">
        <div className="error-message">
          <h2>❌ Something went wrong</h2>
          <p>{error}</p>
          <div className="error-actions">
            <button onClick={createShopifyProduct} className="btn-primary">
              🔄 Try Again
            </button>
            <button onClick={onBack} className="btn-secondary">
              ← Back to Story
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!productData) {
    return (
      <div className="product-checkout empty">
        <div className="empty-message">
          <h2>🛍️ Product Not Ready</h2>
          <p>Please wait while we prepare your story product...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="product-checkout">
      <div className="checkout-header">
        <button onClick={onBack} className="back-button">
          ← Back to Story
        </button>
        <h2>🛍️ Your Personalized Storybook</h2>
      </div>

      <div className="product-display">
        <div className="product-preview">
          <div className="product-image">
            {productData.image ? (
              <img src={productData.image} alt={productData.title} />
            ) : (
              <div className="product-placeholder">
                <span className="product-emoji">📚</span>
              </div>
            )}
          </div>
          
          <div className="product-details">
            <h3>{productData.title}</h3>
            <p className="product-description">{productData.description}</p>
            
            <div className="product-features">
              <div className="feature">
                <span className="feature-icon">🎭</span>
                <span>Theme: {storyData.theme}</span>
              </div>
              <div className="feature">
                <span className="feature-icon">👥</span>
                <span>{storyData.characters?.length || 0} Custom Characters</span>
              </div>
              <div className="feature">
                <span className="feature-icon">📄</span>
                <span>~{Math.ceil((storyData.content?.length || 0) / 250)} Pages</span>
              </div>
              <div className="feature">
                <span className="feature-icon">🎯</span>
                <span>Age {storyData.ageRange}</span>
              </div>
            </div>

            <div className="product-formats">
              <h4>What you'll receive:</h4>
              <ul>
                <li>📱 Digital storybook (PDF)</li>
                <li>🎵 Audio narration (coming soon)</li>
                <li>🖼️ Custom illustrations</li>
                <li>📧 Instant email delivery</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="purchase-section">
          <div className="price-display">
            <span className="price">${productData.price}</span>
            <span className="price-note">One-time purchase</span>
          </div>

          <div className="purchase-actions">
            <button 
              onClick={handleBuyNow}
              className="btn-primary large buy-now"
              disabled={purchaseStatus === 'processing'}
            >
              {purchaseStatus === 'processing' ? (
                <>⏳ Processing...</>
              ) : (
                <>⚡ Buy Now</>
              )}
            </button>

            <button 
              onClick={handlePurchase}
              className="btn-secondary large add-to-cart"
              disabled={purchaseStatus === 'processing'}
            >
              🛒 Add to Cart
            </button>
          </div>

          <div className="purchase-guarantees">
            <div className="guarantee">
              <span className="guarantee-icon">🔒</span>
              <span>Secure checkout</span>
            </div>
            <div className="guarantee">
              <span className="guarantee-icon">⚡</span>
              <span>Instant delivery</span>
            </div>
            <div className="guarantee">
              <span className="guarantee-icon">💯</span>
              <span>100% satisfaction</span>
            </div>
          </div>

          <div className="payment-methods">
            <p>We accept:</p>
            <div className="payment-icons">
              <span>💳</span>
              <span>🍎</span>
              <span>🔵</span>
              <span>📱</span>
            </div>
          </div>
        </div>
      </div>

      {/* Customer reviews section */}
      <div className="social-proof">
        <h3>What other customers say:</h3>
        <div className="reviews">
          <div className="review">
            <div className="stars">⭐⭐⭐⭐⭐</div>
            <p>"My daughter absolutely loves her personalized story! The AI created such a unique adventure."</p>
            <span className="reviewer">- Sarah M.</span>
          </div>
          <div className="review">
            <div className="stars">⭐⭐⭐⭐⭐</div>
            <p>"Amazing quality and so creative. Will definitely order more stories!"</p>
            <span className="reviewer">- Mike R.</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductCheckout;
