import { json } from "@remix-run/node";

export const action = async ({ request }) => {
  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    const { prompt, model = "claude-3-sonnet", max_tokens = 2000, temperature = 0.7 } = await request.json();

    if (!prompt) {
      return json({ error: "Prompt is required" }, { status: 400 });
    }

    const VENICE_API_KEY = process.env.VITE_VENICE_API_KEY;
    const VENICE_API_URL = process.env.VITE_VENICE_API_URL || 'https://api.venice.ai/api/v1';

    if (!VENICE_API_KEY) {
      console.error("Venice API key not configured");
      return json({ error: "Venice AI service not configured" }, { status: 500 });
    }

    console.log("🤖 Generating text with Venice AI:", { model, max_tokens, temperature });

    const response = await fetch(`${VENICE_API_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${VENICE_API_KEY}`,
      },
      body: JSON.stringify({
        model: model,
        messages: [
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: max_tokens,
        temperature: temperature,
        stream: false
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error("Venice API error:", response.status, errorData);
      return json({ 
        error: `Venice AI request failed: ${response.statusText}`,
        details: errorData 
      }, { status: response.status });
    }

    const data = await response.json();
    
    // Extract the generated text from Venice response
    const generatedText = data.choices?.[0]?.message?.content || '';
    
    if (!generatedText) {
      console.error("No text generated from Venice AI:", data);
      return json({ error: "No text generated from Venice AI" }, { status: 500 });
    }

    console.log("✅ Venice text generation successful");

    return json({
      success: true,
      text: generatedText,
      usage: data.usage || {},
      model: data.model || model
    });

  } catch (error) {
    console.error("Venice text generation error:", error);
    return json({
      error: "Internal server error during text generation",
      details: error.message
    }, { status: 500 });
  }
};