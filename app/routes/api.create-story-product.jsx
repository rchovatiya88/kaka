// API Route: Create Story Product
// File: app/routes/api.create-story-product.jsx

import { json } from "@remix-run/node";
import { prisma } from "~/db.server";
import { authenticate } from "~/shopify.server";

export const action = async ({ request }) => {
  const { admin } = await authenticate.admin(request);
  
  try {
    const body = await request.json();
    const {
      title,
      description,
      content,
      theme,
      characters,
      ageRange,
      price,
      tags = []
    } = body;

    // Validate required fields
    if (!title || !content || !price) {
      return json({ error: "Missing required fields" }, { status: 400 });
    }

    // Create the product in Shopify
    const productData = {
      title: title,
      body_html: `
        <div class="story-product-description">
          <h3>Your Personalized ${theme} Adventure</h3>
          <p>${description}</p>
          
          <div class="story-features">
            <h4>What makes this story special:</h4>
            <ul>
              <li>🎭 <strong>Theme:</strong> ${theme}</li>
              <li>👥 <strong>Characters:</strong> ${characters?.length || 0} personalized characters</li>
              <li>🎯 <strong>Age Range:</strong> Perfect for ages ${ageRange}</li>
              <li>📖 <strong>Length:</strong> ~${Math.ceil(content.length / 250)} pages</li>
              <li>📱 <strong>Format:</strong> High-quality PDF with custom illustrations</li>
            </ul>
          </div>

          <div class="story-preview">
            <h4>Story Preview:</h4>
            <p style="font-style: italic; background: #f9f9f9; padding: 15px; border-radius: 8px;">
              ${content.substring(0, 200)}...
            </p>
          </div>

          <div class="delivery-info">
            <h4>Delivery & Access:</h4>
            <ul>
              <li>⚡ Instant digital delivery via email</li>
              <li>📱 Access on any device (PDF format)</li>
              <li>🎵 Audio narration included (coming soon)</li>
              <li>🖼️ Custom cover art and illustrations</li>
            </ul>
          </div>
        </div>
      `,
      vendor: "AI Storybook Creator",
      product_type: "Digital Story",
      tags: tags.join(", "),
      status: "active",
      variants: [
        {
          price: price.toString(),
          inventory_management: "shopify",
          inventory_quantity: 999, // High number for digital product
          requires_shipping: false,
          taxable: true,
          title: "Digital Download",
          sku: `STORY-${Date.now()}`,
          weight: 0,
          weight_unit: "lb"
        }
      ],
      options: [
        {
          name: "Format",
          values: ["Digital Download"]
        }
      ],
      metafields: [
        {
          namespace: "custom",
          key: "story_content",
          value: content,
          type: "multi_line_text_field"
        },
        {
          namespace: "custom", 
          key: "story_theme",
          value: theme,
          type: "single_line_text_field"
        },
        {
          namespace: "custom",
          key: "story_characters",
          value: JSON.stringify(characters || []),
          type: "json"
        },
        {
          namespace: "custom",
          key: "age_range", 
          value: ageRange,
          type: "single_line_text_field"
        },
        {
          namespace: "custom",
          key: "created_by_ai",
          value: "true",
          type: "boolean"
        }
      ]
    };

    // Create product in Shopify
    const response = await admin.rest.resources.Product.save({
      session: admin.session,
      ...productData
    });

    if (!response.success) {
      throw new Error("Failed to create product in Shopify");
    }

    const product = response.body.product;

    // Store in our database for tracking
    const storyRecord = await prisma.story.create({
      data: {
        title: title,
        content: content,
        theme: theme,
        characters: JSON.stringify(characters || []),
        ageRange: ageRange,
        shopifyProductId: product.id.toString(),
        shopifyVariantId: product.variants[0].id.toString(),
        price: parseFloat(price),
        status: 'published',
        createdAt: new Date()
      }
    });

    // Generate cover image (placeholder for now)
    const coverImageUrl = await generateStoryCover(title, theme);

    // Add product image if cover was generated
    if (coverImageUrl) {
      try {
        await admin.rest.resources.Image.save({
          session: admin.session,
          product_id: product.id,
          src: coverImageUrl,
          alt: `${title} cover art`
        });
      } catch (imageError) {
        console.error("Failed to add product image:", imageError);
        // Continue without image - not critical
      }
    }

    // Return product data for frontend
    return json({
      id: product.id,
      title: product.title,
      description: description,
      price: price,
      variant_id: product.variants[0].id,
      handle: product.handle,
      image: coverImageUrl,
      story_id: storyRecord.id,
      url: `/products/${product.handle}`,
      tags: tags
    });

  } catch (error) {
    console.error("Error creating story product:", error);
    return json(
      { error: "Failed to create story product", details: error.message },
      { status: 500 }
    );
  }
};

// Helper function to generate cover image (placeholder)
async function generateStoryCover(title, theme) {
  // For now, return a placeholder image URL
  // In production, you'd integrate with an AI image generation service
  const themeImages = {
    "Pirate Adventure": "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=400",
    "Space Adventure": "https://images.unsplash.com/photo-1446776653964-20c1d3a81b06?w=400", 
    "Fairy Tale": "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400",
    "Detective Mystery": "https://images.unsplash.com/photo-1481026469463-66327c86e544?w=400"
  };

  return themeImages[theme] || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400";
}
