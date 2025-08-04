// API Route: Generate Story with AI
// File: app/routes/api.generate-story.jsx

import { json } from "@remix-run/node";

export const action = async ({ request }) => {
  try {
    const body = await request.json();
    const {
      theme,
      mainCharacter,
      setting,
      ageRange,
      storyLength,
      specialRequests,
      additionalCharacters = []
    } = body;

    // Validate required fields
    if (!theme || !mainCharacter || !ageRange) {
      return json({ error: "Missing required story parameters" }, { status: 400 });
    }

    // Generate story using AI (Venice AI integration)
    const storyContent = await generateStoryWithAI({
      theme,
      mainCharacter,
      setting,
      ageRange,
      storyLength,
      specialRequests,
      additionalCharacters
    });

    // Create story metadata
    const storyData = {
      title: generateStoryTitle(theme, mainCharacter),
      content: storyContent,
      theme: theme,
      themeEmoji: getThemeEmoji(theme),
      ageRange: ageRange,
      characters: [
        { name: mainCharacter.name, role: "Main Character" },
        ...additionalCharacters.map(char => ({ name: char.name, role: char.role || "Supporting Character" }))
      ],
      setting: setting,
      summary: generateStorySummary(storyContent),
      wordCount: storyContent.split(' ').length,
      estimatedReadingTime: Math.ceil(storyContent.split(' ').length / 200), // 200 words per minute
      createdAt: new Date().toISOString()
    };

    return json(storyData);

  } catch (error) {
    console.error("Error generating story:", error);
    return json(
      { error: "Failed to generate story", details: error.message },
      { status: 500 }
    );
  }
};

// AI Story Generation Function
async function generateStoryWithAI(params) {
  const {
    theme,
    mainCharacter,
    setting,
    ageRange,
    storyLength,
    specialRequests,
    additionalCharacters
  } = params;

  // Build AI prompt based on parameters
  const prompt = buildStoryPrompt(params);
  
  try {
    // Venice AI API call (replace with your actual API key and endpoint)
    const response = await fetch('https://api.venice.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.VENICE_AI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instruct',
        messages: [
          {
            role: 'system',
            content: `You are a professional children's story writer. Create engaging, age-appropriate stories that are imaginative, educational, and fun. Always ensure the content is suitable for the specified age range and includes positive messages.`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: getMaxTokensForLength(storyLength),
        temperature: 0.8,
        top_p: 0.9
      })
    });

    if (!response.ok) {
      throw new Error(`Venice AI API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const storyContent = data.choices[0]?.message?.content;

    if (!storyContent) {
      throw new Error("No story content received from AI");
    }

    return storyContent.trim();

  } catch (error) {
    console.error("Venice AI API error:", error);
    
    // Fallback to template-based story generation
    return generateFallbackStory(params);
  }
}

// Build detailed prompt for AI story generation
function buildStoryPrompt(params) {
  const {
    theme,
    mainCharacter,
    setting,
    ageRange,
    storyLength,
    specialRequests,
    additionalCharacters
  } = params;

  let prompt = `Create a ${storyLength} ${theme.toLowerCase()} story for children aged ${ageRange}.

MAIN CHARACTER:
- Name: ${mainCharacter.name}
- Age: ${mainCharacter.age || 'age-appropriate for target audience'}
- Personality: ${mainCharacter.personality || 'brave and curious'}
- Special traits: ${mainCharacter.traits || 'determined to help others'}

SETTING: ${setting || 'A magical place full of wonder and adventure'}

ADDITIONAL CHARACTERS:${additionalCharacters.length > 0 
  ? additionalCharacters.map(char => `\n- ${char.name}: ${char.role || 'Supporting character'}`).join('')
  : '\n- Create 1-2 supporting characters that help the main character'}

STORY REQUIREMENTS:
- Theme: ${theme}
- Length: ${storyLength} (aim for ${getWordCountTarget(storyLength)} words)
- Age-appropriate for: ${ageRange}
- Include positive messages about friendship, courage, and problem-solving
- Make it engaging with dialogue, action, and descriptive scenes
- Include a clear beginning, middle, and end
- Ensure a satisfying resolution

${specialRequests ? `SPECIAL REQUESTS: ${specialRequests}` : ''}

Write the complete story now:`;

  return prompt;
}

// Get target word count based on story length
function getWordCountTarget(storyLength) {
  const wordCounts = {
    'Short': '500-800',
    'Medium': '800-1500', 
    'Long': '1500-2500'
  };
  return wordCounts[storyLength] || '800-1500';
}

// Get max tokens for AI based on story length
function getMaxTokensForLength(storyLength) {
  const tokenLimits = {
    'Short': 1000,
    'Medium': 2000,
    'Long': 3000
  };
  return tokenLimits[storyLength] || 2000;
}

// Generate story title
function generateStoryTitle(theme, mainCharacter) {
  const titleTemplates = {
    "Pirate Adventure": [
      `${mainCharacter.name} and the Treasure of Skull Island`,
      `Captain ${mainCharacter.name}'s Great Adventure`,
      `${mainCharacter.name} Sails the Seven Seas`
    ],
    "Space Adventure": [
      `${mainCharacter.name}'s Journey to the Stars`,
      `Commander ${mainCharacter.name} Saves the Galaxy`,
      `${mainCharacter.name} and the Alien Mystery`
    ],
    "Fairy Tale": [
      `${mainCharacter.name} and the Enchanted Forest`,
      `The Magical Adventures of ${mainCharacter.name}`,
      `${mainCharacter.name} and the Dragon's Secret`
    ],
    "Detective Mystery": [
      `Detective ${mainCharacter.name} Solves the Case`,
      `${mainCharacter.name} and the Missing Treasure`,
      `The Mystery of ${mainCharacter.name}'s Town`
    ]
  };

  const templates = titleTemplates[theme] || [`The Adventures of ${mainCharacter.name}`];
  return templates[Math.floor(Math.random() * templates.length)];
}

// Get theme emoji
function getThemeEmoji(theme) {
  const emojis = {
    "Pirate Adventure": "🏴‍☠️",
    "Space Adventure": "🚀",
    "Fairy Tale": "🏰",
    "Detective Mystery": "🔍"
  };
  return emojis[theme] || "📚";
}

// Generate story summary
function generateStorySummary(content) {
  // Extract first paragraph or first 150 characters as summary
  const sentences = content.split('. ');
  const summary = sentences.slice(0, 2).join('. ');
  return summary.length > 150 ? summary.substring(0, 150) + '...' : summary + '.';
}

// Fallback story generation (template-based)
function generateFallbackStory(params) {
  const { theme, mainCharacter, setting, ageRange } = params;
  
  // Simple template-based story as fallback
  return `Once upon a time, there was a brave child named ${mainCharacter.name} who lived in ${setting || 'a wonderful place'}. 

${mainCharacter.name} loved going on ${theme.toLowerCase()} adventures and was known throughout the land for being kind and helpful to everyone they met.

One sunny morning, ${mainCharacter.name} discovered something amazing that would change everything. It was the beginning of the greatest adventure yet!

Through courage, friendship, and determination, ${mainCharacter.name} overcame every challenge and helped everyone along the way.

And they all lived happily ever after, with ${mainCharacter.name} knowing that the best adventures come from helping others and believing in yourself.

The End.`;
}
