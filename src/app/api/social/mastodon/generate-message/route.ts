import { NextResponse } from "next/server";
import { strict_output } from "@/lib/gpt";

export async function POST(req: Request) {
    try {
        const { topic, type, userInput, apiKey, model, serverUrl } = await req.json();

        if (!apiKey) {
            return NextResponse.json(
                { error: "AnythingLLM API key is required" },
                { status: 401 }
            );
        }

        if (!serverUrl) {
            return NextResponse.json(
                { error: "AnythingLLM server URL is required" },
                { status: 401 }
            );
        }

        const llamaInstructions = model.toLowerCase().includes('llama') ? 
            `CRITICAL INSTRUCTIONS FOR LLAMA:
- DO NOT output the actual quiz questions
- DO NOT list multiple choice options
- DO NOT use A), B), C) format
- Instead, create an engaging Mastodon toot that teases the topic
- Focus on creating curiosity about the quiz
- Keep it community-focused and engaging` : '';

        const system_prompt = `You are a social media expert who creates engaging Mastodon toots that respect the platform's federated, community-focused nature while driving engagement. ${llamaInstructions}`;
        
        const llamaExample = model.toLowerCase().includes('llama') ? 
            `\nIMPORTANT FOR LLAMA:
- DO NOT write out any quiz questions
- DO NOT list any answer options
- DO NOT use A), B), C) format
- Instead, write a toot that makes people curious about the quiz
- Example: "🐧 Hey #Fediverse! Ready to test your Linux knowledge? 

We've crafted a community-driven quiz to help you explore your command-line expertise. Perfect for both newcomers and seasoned users!

#Linux #OpenSource #TechCommunity"` : '';

        const user_prompt = `Generate an engaging Mastodon toot for a quiz about ${topic}.
Quiz Type: ${type === 'mcq' ? 'Multiple Choice' : 'Open Ended'}
Additional Context: ${userInput || 'None provided'}

Requirements:
- Keep it community-focused and respectful
- Use content warnings when appropriate
- Include relevant hashtags for discoverability
- Make it engaging but not overly promotional
- Consider the federated nature of Mastodon
- Add clear call-to-action
- Maximum 2-3 short paragraphs
- Include #Fediverse tag
- Encourage participation WITHOUT revealing questions${llamaExample}

Format the response in a way that's ready to be posted as a Mastodon toot.`;

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
                { error: `AnythingLLM API returned ${response.status}: ${response.statusText}` },
                { status: response.status }
            );
        }

        const data = await response.json();
        if (!data?.choices?.[0]?.message?.content) {
            return NextResponse.json(
                { error: 'Invalid response format from AnythingLLM' },
                { status: 500 }
            );
        }

        return NextResponse.json({ 
            message: data.choices[0].message.content,
            success: true
        });

    } catch (error) {
        console.error("Error generating Mastodon toot:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to generate Mastodon toot" },
            { status: 500 }
        );
    }
} 