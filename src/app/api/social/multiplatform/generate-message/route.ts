export async function POST(req: Request) {
    try {
        const { topic, type, userInput, apiKey, model, selectedPlatforms, quizUrl } = await req.json();

        if (!apiKey) {
            throw new Error("AnythingLLM API key is required");
        }

        const llamaInstructions = model.toLowerCase().includes('llama') ? 
            `CRITICAL INSTRUCTIONS FOR LLAMA:
- DO NOT output the actual quiz questions
- DO NOT list multiple choice options
- DO NOT use A), B), C) format
- Instead, create engaging social media content that teases the topic
- Focus on creating curiosity about the quiz
- Keep it conversational and engaging` : '';

        const system_prompt = `You are a social media expert who creates engaging content optimized for different social media platforms. Your task is to generate both a versatile general message and platform-specific messages that follow each platform's best practices. ${llamaInstructions}

IMPORTANT: Return ONLY a valid JSON object with a general message and platform-specific messages. Do not include any markdown formatting or explanatory text.`;
        
        const llamaExample = model.toLowerCase().includes('llama') ? 
            `\nIMPORTANT FOR LLAMA:
- DO NOT write out any quiz questions
- DO NOT list any answer options
- DO NOT use A), B), C) format
- Instead, write content that makes people curious about the quiz` : '';

        const platformRequirements = {
            twitter: "280 characters max, hashtags, casual tone",
            instagram: "Visual-focused, emojis, hashtags, engaging captions",
            facebook: "Detailed, community-focused, can be longer",
            linkedin: "Professional tone, industry-relevant hashtags",
            tiktok: "Very casual, trendy, use trending phrases",
            pinterest: "Visual inspiration, descriptive",
            youtube: "Detailed description, good for SEO",
            mastodon: "500 characters max, community-focused, #Fediverse tag",
            threads: "Conversational, casual tone",
            bluesky: "300 characters max, similar to Twitter style"
        };

        const user_prompt = `Create social media content for a quiz about ${topic}. The quiz type is ${type}.

${userInput ? `Use this input as inspiration: ${userInput}` : ''}

First, create a general message that works well across all platforms.
Then, create platform-specific messages for: ${selectedPlatforms.join(', ')}.

Platform-specific requirements:
${selectedPlatforms.map((platform: string) => `- ${platform}: ${platformRequirements[platform as keyof typeof platformRequirements]}`).join('\n')}

General requirements for all messages:
1. Keep it engaging and shareable
2. Use emojis appropriately
3. Include relevant hashtags
4. Include the quiz URL: ${quizUrl}
5. Make it attention-grabbing
6. Focus on creating curiosity about the quiz

Return ONLY a valid JSON object in this exact format (no markdown, no explanations):
{
    "general": "Your general message here",
    "platforms": {
        "platform1": "Platform-specific message 1",
        "platform2": "Platform-specific message 2"
    }
}

${llamaExample}`;

        const response = await fetch(`${process.env.NEXT_PUBLIC_ANYTHING_LLM_URL}/api/v1/openai/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                messages: [
                    {
                        role: "system",
                        content: system_prompt
                    },
                    {
                        role: "user",
                        content: user_prompt
                    }
                ],
                model,
                temperature: 0.7,
                stream: false
            })
        });

        if (!response.ok) {
            throw new Error(`AnythingLLM API error: ${response.statusText}`);
        }

        const data = await response.json();
        const content = data?.choices?.[0]?.message?.content;

        if (!content) {
            throw new Error("No content received from AnythingLLM");
        }

        // Parse the JSON response
        try {
            // Clean up the content before parsing
            let cleanContent = content;
            
            // Remove markdown code block if present
            cleanContent = cleanContent.replace(/```json\n|\n```/g, '');
            
            // Remove any explanatory text before or after the JSON
            const jsonStart = cleanContent.indexOf('{');
            const jsonEnd = cleanContent.lastIndexOf('}') + 1;
            if (jsonStart !== -1 && jsonEnd !== -1) {
                cleanContent = cleanContent.slice(jsonStart, jsonEnd);
            }

            const messages = JSON.parse(cleanContent);
            
            // Clean up the messages
            const cleanMessage = (msg: string) => {
                let cleaned = msg;
                // Remove any markdown formatting
                cleaned = cleaned.replace(/\*\*/g, '');
                // Remove any "Message:" prefix
                cleaned = cleaned.replace(/^Message:\s*/i, '');
                // Trim whitespace
                cleaned = cleaned.trim();
                return cleaned;
            };

            // Clean the general message
            messages.general = cleanMessage(messages.general);

            // Clean each platform-specific message
            Object.keys(messages.platforms).forEach(platform => {
                messages.platforms[platform] = cleanMessage(messages.platforms[platform]);
            });

            return Response.json(messages);
        } catch (error) {
            console.error("Error parsing content as JSON:", error, "\nContent:", content);
            throw new Error("Failed to parse response as JSON");
        }
    } catch (error) {
        console.error("Error generating content:", error);
        return Response.json({ error: error instanceof Error ? error.message : "Failed to generate content" }, { status: 500 });
    }
} 