import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const { topic, type, userInput, apiKey, model, selectedPlatforms, quizUrl, serverUrl } = await req.json();

        if (!apiKey) {
            return NextResponse.json(
                { error: "AnythingLLM API key is required", success: false },
                { status: 401 }
            );
        }

        if (!serverUrl) {
            return NextResponse.json(
                { error: "AnythingLLM server URL is required", success: false },
                { status: 401 }
            );
        }

        if (!selectedPlatforms || !Array.isArray(selectedPlatforms) || selectedPlatforms.length === 0) {
            return NextResponse.json(
                { error: "At least one platform must be selected", success: false },
                { status: 400 }
            );
        }

        const llamaInstructions = model.toLowerCase().includes('llama') ? 
            `CRITICAL INSTRUCTIONS FOR LLAMA:
- DO NOT output the actual quiz questions
- DO NOT list multiple choice options
- DO NOT use A), B), C) format
- Instead, create engaging content that teases the topic
- Focus on creating curiosity about the quiz
- Keep it conversational and engaging
- DO NOT use markdown formatting or headers` : '';

        const system_prompt = `You are a social media expert who creates versatile content that works well across different social media platforms. Your task is to generate a general message that can be adapted for various platforms. ${llamaInstructions}

IMPORTANT: 
- Focus on creating content that is adaptable and works well across different platforms
- Return the message directly without any markdown formatting, headers, or section titles
- Do not include placeholders like [Quiz Link Will Be Automatically Added Here]`;

        const user_prompt = `Create a versatile social media message for a quiz about ${topic}. The quiz type is ${type}.
This message should work well across these platforms: ${selectedPlatforms.join(', ')}.

${userInput ? `Use this input as inspiration: ${userInput}` : ''}

Requirements:
1. Keep it engaging and shareable across all platforms
2. Use emojis appropriately (not too many, not too few)
3. Include relevant hashtags that work on all platforms
4. Include this exact quiz URL: ${quizUrl}
5. Make it attention-grabbing
6. Focus on creating curiosity about the quiz
7. Keep it adaptable for different platform styles
8. Avoid platform-specific features or limitations
9. Use a tone that works everywhere
10. DO NOT use any markdown formatting or headers
11. DO NOT use placeholders for the quiz URL

The message should be general enough to work on any platform but engaging enough to drive participation.

Return ONLY the message content, without any formatting or headers.`;

        // Clean up server URL
        const apiUrl = serverUrl.endsWith('/') ? serverUrl.slice(0, -1) : serverUrl;
        const response = await fetch(`${apiUrl}/api/v1/openai/chat/completions`, {
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
            console.error(`AnythingLLM API error: ${response.status} - ${response.statusText}`);
            return NextResponse.json(
                { error: `AnythingLLM API returned ${response.status}: ${response.statusText}`, success: false },
                { status: response.status }
            );
        }

        const data = await response.json();
        if (!data?.choices?.[0]?.message?.content) {
            return NextResponse.json(
                { error: 'Invalid response format from AnythingLLM', success: false },
                { status: 500 }
            );
        }

        try {
            const content = data.choices[0].message.content;
            
            // Enhanced message cleaning
            const cleanMessage = (msg: string) => {
                return msg
                    .replace(/^\*\*[^*]+\*\*\s*/gm, '') // Remove markdown headers anywhere in the text
                    .replace(/\*\*([^*]+)\*\*/g, '$1')  // Remove bold formatting
                    .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1') // Remove markdown links
                    .replace(/\[[^\]]+\]/g, '')         // Remove remaining brackets
                    .replace(/\\n/g, '\n')              // Fix newlines
                    .replace(/\n{3,}/g, '\n\n')        // Normalize multiple newlines
                    .replace(/^[\s\n]+|[\s\n]+$/g, '') // Trim whitespace and newlines
                    .trim();
            };

            const cleanedMessage = cleanMessage(content);

            // Verify the quiz URL is included
            if (!cleanedMessage.includes(quizUrl)) {
                throw new Error('Generated message is missing the quiz URL');
            }

            return NextResponse.json({ 
                message: cleanedMessage,
                success: true
            });

        } catch (error) {
            console.error("Error processing message:", error);
            return NextResponse.json(
                { error: error instanceof Error ? error.message : 'Failed to process the generated message', success: false },
                { status: 500 }
            );
        }
    } catch (error) {
        console.error("Error generating multiplatform message:", error);
        return NextResponse.json({
            error: error instanceof Error ? error.message : "Failed to generate multiplatform message",
            success: false
        }, { status: 500 });
    }
} 