import { json } from "@remix-run/node";

export const action = async ({ request }) => {
  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    const { 
      prompt, 
      model = "flux-dev", 
      width = 1024, 
      height = 1024,
      num_inference_steps = 30,
      guidance_scale = 7.5,
      seed
    } = await request.json();

    if (!prompt) {
      return json({ error: "Prompt is required" }, { status: 400 });
    }

    const VENICE_API_KEY = process.env.VITE_VENICE_API_KEY;
    const VENICE_API_URL = process.env.VITE_VENICE_API_URL || 'https://api.venice.ai/api/v1';

    if (!VENICE_API_KEY) {
      console.error("Venice API key not configured");
      return json({ error: "Venice AI service not configured" }, { status: 500 });
    }

    console.log("🎨 Generating image with Venice AI:", { 
      model, 
      width, 
      height, 
      num_inference_steps, 
      guidance_scale,
      seed 
    });

    const requestBody = {
      model: model,
      prompt: prompt,
      width: width,
      height: height,
      num_inference_steps: num_inference_steps,
      guidance_scale: guidance_scale,
    };

    // Add seed if provided
    if (seed !== undefined) {
      requestBody.seed = seed;
    }

    const response = await fetch(`${VENICE_API_URL}/images/generations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${VENICE_API_KEY}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error("Venice Image API error:", response.status, errorData);
      return json({ 
        error: `Venice AI image request failed: ${response.statusText}`,
        details: errorData 
      }, { status: response.status });
    }

    const data = await response.json();
    
    // Extract the generated image URL from Venice response
    const imageUrl = data.data?.[0]?.url || data.url || '';
    
    if (!imageUrl) {
      console.error("No image URL in Venice response:", data);
      return json({ error: "No image generated from Venice AI" }, { status: 500 });
    }

    console.log("✅ Venice image generation successful");

    return json({
      success: true,
      image_url: imageUrl,
      prompt: prompt,
      model: data.model || model,
      dimensions: { width, height },
      seed: data.seed || seed
    });

  } catch (error) {
    console.error("Venice image generation error:", error);
    return json({
      error: "Internal server error during image generation",
      details: error.message
    }, { status: 500 });
  }
};