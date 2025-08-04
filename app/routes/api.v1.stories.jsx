import { json } from "@remix-run/node";
import { authenticate } from "../shopify.server";

// Story generation prompts inspired by kakafullstack
const generateStoryPrompt = (characterName, storyGuidance, theme, language, ageGroup) => {
  const languagePrompts = {
    'en': {
      system: `You are a professional children's story writer specializing in creating engaging, age-appropriate stories for ${ageGroup} year olds. Create stories that are educational, fun, and inspiring.`,
      instruction: `Create a magical children's story with the following requirements:
- Main character: ${characterName}
- Story theme: ${theme}
- Story guidance: ${storyGuidance}
- Target age: ${ageGroup} years old
- Must be exactly 5 pages long
- Each page should have 2-3 sentences
- Include moral lessons appropriate for the age group
- Use simple, engaging language
- Create an adventure that children can relate to

Format the response as a JSON object with:
{
  "title": "Story Title",
  "pages": [
    {
      "pageNumber": 1,
      "text": "Page content here...",
      "imagePrompt": "Detailed description for illustration..."
    }
  ]
}`
    },
    'es': {
      system: `Eres un escritor profesional de cuentos infantiles especializado en crear historias atractivas y apropiadas para niños de ${ageGroup} años. Crea historias educativas, divertidas e inspiradoras.`,
      instruction: `Crea un cuento mágico para niños con los siguientes requisitos:
- Personaje principal: ${characterName}
- Tema del cuento: ${theme}
- Guía de la historia: ${storyGuidance}
- Edad objetivo: ${ageGroup} años
- Debe tener exactamente 5 páginas
- Cada página debe tener 2-3 oraciones
- Incluir lecciones morales apropiadas para la edad
- Usar lenguaje simple y atractivo
- Crear una aventura con la que los niños puedan identificarse

Formatea la respuesta como un objeto JSON con:
{
  "title": "Título del Cuento",
  "pages": [
    {
      "pageNumber": 1,
      "text": "Contenido de la página aquí...",
      "imagePrompt": "Descripción detallada para la ilustración..."
    }
  ]
}`
    },
    'hi': {
      system: `आप एक पेशेवर बच्चों की कहानी लेखक हैं जो ${ageGroup} साल के बच्चों के लिए आकर्षक, उम्र-उपयुक्त कहानियां बनाने में विशेषज्ञ हैं। शैक्षिक, मजेदार और प्रेरणादायक कहानियां बनाएं।`,
      instruction: `निम्नलिखित आवश्यकताओं के साथ एक जादुई बच्चों की कहानी बनाएं:
- मुख्य पात्र: ${characterName}
- कहानी का विषय: ${theme}
- कहानी का मार्गदर्शन: ${storyGuidance}
- लक्षित आयु: ${ageGroup} साल
- बिल्कुल 5 पन्ने होने चाहिए
- हर पन्ने में 2-3 वाक्य होने चाहिए
- उम्र के लिए उपयुक्त नैतिक शिक्षा शामिल करें
- सरल, आकर्षक भाषा का उपयोग करें
- एक ऐसा रोमांच बनाएं जिससे बच्चे जुड़ सकें

जवाब को JSON ऑब्जेक्ट के रूप में फॉर्मेट करें:
{
  "title": "कहानी का शीर्षक",
  "pages": [
    {
      "pageNumber": 1,
      "text": "पन्ने की सामग्री यहाँ...",
      "imagePrompt": "चित्रण के लिए विस्तृत विवरण..."
    }
  ]
}`
    }
  };

  return languagePrompts[language] || languagePrompts['en'];
};

const generateImagePrompt = (pageText, characterName, artStyle, theme, characterDescription) => {
  const stylePrompts = {
    'watercolor': 'soft watercolor painting style, gentle colors, dreamy atmosphere',
    'cartoon': 'colorful cartoon illustration, bright and cheerful, child-friendly',
    'anime': 'anime/manga style artwork, expressive characters, vibrant colors',
    'storybook': 'classic children\'s book illustration, warm and inviting',
    'sketch': 'hand-drawn pencil sketch style, artistic and detailed',
    'digital': 'modern digital art style, crisp and colorful'
  };

  const basePrompt = `Children's book illustration in ${stylePrompts[artStyle] || stylePrompts['storybook']} showing: ${pageText}`;
  
  if (characterDescription) {
    return `${basePrompt}. Main character ${characterName}: ${characterDescription}. Theme: ${theme}. Safe for children, no scary elements.`;
  }
  
  return `${basePrompt}. Main character: ${characterName}. Theme: ${theme}. Safe for children, no scary elements.`;
};

export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  
  // TODO: Fetch stories from database for this shop
  // For now, return empty array
  return json({
    stories: [],
    totalCount: 0,
    page: 1,
    limit: 20
  });
};

export const action = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  
  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    const formData = await request.formData();
    
    const characterName = formData.get('childName') || formData.get('characterName');
    const storyGuidance = formData.get('characterDescription') || formData.get('storyGuidance');
    const theme = formData.get('storyTheme') || 'adventure';
    const artStyle = formData.get('artStyle') || 'storybook';
    const language = formData.get('language') || 'en';
    const ageGroup = formData.get('childAge') || '4-8';
    const pageCount = parseInt(formData.get('storyLength')) || 5;
    const specialRequests = formData.get('specialRequests') || '';
    const includeAudio = formData.get('includeAudio') === 'true';
    
    // Handle character image if uploaded
    const characterImage = formData.get('characterImage');
    const characterDetails = formData.get('characterDetails');
    
    let characterDescription = '';
    if (characterDetails) {
      try {
        const details = JSON.parse(characterDetails);
        characterDescription = `A ${details.age} ${details.gender} with ${details.hairColor} ${details.hairStyle} hair, ${details.eyeColor} eyes, ${details.skinTone} skin tone${details.specialFeatures ? `, ${details.specialFeatures}` : ''}`;
      } catch (e) {
        console.warn('Failed to parse character details:', e);
      }
    }

    if (!characterName || !storyGuidance) {
      return json({ 
        error: "Character name and story guidance are required" 
      }, { status: 400 });
    }

    console.log("🚀 Starting story generation:", {
      characterName,
      theme,
      language,
      ageGroup,
      artStyle,
      pageCount,
      hasCharacterImage: !!characterImage
    });

    // Step 1: Generate story text with Venice AI
    const storyPrompt = generateStoryPrompt(characterName, storyGuidance, theme, language, ageGroup);
    
    const textResponse = await fetch(`${request.url.replace(/\/api\/v1\/stories.*/, '')}/api/v1/venice/text`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: `${storyPrompt.system}\n\n${storyPrompt.instruction}`,
        model: 'claude-3-sonnet',
        max_tokens: 2000,
        temperature: 0.8
      }),
    });

    if (!textResponse.ok) {
      const error = await textResponse.json();
      console.error("Story text generation failed:", error);
      return json({ 
        error: "Failed to generate story text",
        details: error.error 
      }, { status: 500 });
    }

    const textData = await textResponse.json();
    let storyData;
    
    try {
      // Try to parse JSON from the generated text
      const jsonMatch = textData.text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        storyData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (e) {
      console.error("Failed to parse story JSON:", e);
      // Fallback: create basic story structure
      storyData = {
        title: `${characterName}'s Adventure`,
        pages: [{
          pageNumber: 1,
          text: textData.text.slice(0, 200) + "...",
          imagePrompt: `${characterName} on an adventure`
        }]
      };
    }

    console.log("✅ Story text generated:", storyData.title);

    // Step 2: Generate images for each page
    const pagesWithImages = await Promise.all(
      storyData.pages.map(async (page, index) => {
        try {
          const imagePrompt = generateImagePrompt(
            page.text, 
            characterName, 
            artStyle, 
            theme, 
            characterDescription
          );

          console.log(`🎨 Generating image for page ${page.pageNumber}...`);

          const imageResponse = await fetch(`${request.url.replace(/\/api\/v1\/stories.*/, '')}/api/v1/venice/image`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              prompt: imagePrompt,
              model: 'flux-dev',
              width: 1024,
              height: 1024,
              num_inference_steps: 30,
              guidance_scale: 7.5
            }),
          });

          if (imageResponse.ok) {
            const imageData = await imageResponse.json();
            console.log(`✅ Image generated for page ${page.pageNumber}`);
            
            return {
              ...page,
              imageUrl: imageData.image_url,
              imagePrompt: imagePrompt
            };
          } else {
            console.error(`Failed to generate image for page ${page.pageNumber}`);
            return {
              ...page,
              imageUrl: '/placeholder-story-image.jpg',
              imagePrompt: imagePrompt
            };
          }
        } catch (error) {
          console.error(`Error generating image for page ${page.pageNumber}:`, error);
          return {
            ...page,
            imageUrl: '/placeholder-story-image.jpg',
            imagePrompt: page.imagePrompt || `Illustration for page ${page.pageNumber}`
          };
        }
      })
    );

    // Step 3: Create story object
    const story = {
      id: `story_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title: storyData.title,
      childName: characterName,
      mainCharacter: characterName,
      theme: theme,
      artStyle: artStyle,
      language: language,
      ageGroup: ageGroup,
      pageCount: pagesWithImages.length,
      status: 'completed',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isPublic: false,
      hasAudio: includeAudio,
      summary: storyGuidance,
      characterDescription: characterDescription || `The main character of this ${theme} story`,
      specialRequests: specialRequests,
      pages: pagesWithImages,
      shopId: session.shop,
      // TODO: Store story in database
    };

    console.log("🎉 Story generation completed successfully:", story.title);

    // TODO: Save story to database
    // await saveStoryToDatabase(story);
    
    // For now, just return the story
    return json({
      success: true,
      story: story,
      message: "Story created successfully!"
    });

  } catch (error) {
    console.error("Story generation error:", error);
    return json({
      error: "Failed to generate story",
      details: error.message
    }, { status: 500 });
  }
};