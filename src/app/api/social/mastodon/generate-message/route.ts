import { NextResponse } from "next/server";
import { strict_output } from "@/lib/gpt";

export async function POST(req: Request) {
    try {
        const { topic, type, userInput, apiKey, model } = await req.json();

        if (!apiKey) {
            throw new Error("AnythingLLM API key is required");
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

        return NextResponse.json({ message: content });
    } catch (error) {
        console.error("Error generating Mastodon toot:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to generate Mastodon toot" },
            { status: 500 }
        );
    }
} 