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
- Instead, create an engaging Facebook post that teases the topic
- Focus on creating curiosity about the quiz
- Keep it conversational and engaging` : '';

        const system_prompt = `You are a social media expert who creates engaging Facebook posts that drive engagement while maintaining professionalism. ${llamaInstructions}`;
        
        const llamaExample = model.toLowerCase().includes('llama') ? 
            `\nIMPORTANT FOR LLAMA:
- DO NOT write out any quiz questions
- DO NOT list any answer options
- DO NOT use A), B), C) format
- Instead, write a post that makes people curious about the quiz
- Example: "🐧 Calling all Linux enthusiasts! 

Think you know your way around the command line? We've put together an exciting challenge to test your Linux expertise! 

Join our community of tech enthusiasts and see how you stack up. Whether you're a beginner or a seasoned pro, this quiz has something for everyone! 🚀"` : '';

        const user_prompt = `Generate an engaging Facebook post for a quiz about ${topic}.
Quiz Type: ${type === 'mcq' ? 'Multiple Choice' : 'Open Ended'}
Additional Context: ${userInput || 'None provided'}

Requirements:
- Keep it informative but conversational
- Use emojis appropriately
- Include a clear call-to-action
- Make it shareable and engaging
- Add engaging questions to encourage participation WITHOUT revealing quiz content
- Maximum 2-3 short paragraphs${llamaExample}

Format the response in a way that's ready to be posted on Facebook.`;

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
        console.error("Error generating Facebook post message:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to generate Facebook post message" },
            { status: 500 }
        );
    }
} 