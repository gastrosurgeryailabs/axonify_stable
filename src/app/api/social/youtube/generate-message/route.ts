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
- Instead, create an engaging YouTube description that teases the topic
- Focus on creating curiosity about the quiz
- Keep it SEO-friendly and engaging` : '';

        const system_prompt = `You are a social media expert who creates engaging YouTube video descriptions that drive engagement and discovery through SEO optimization. ${llamaInstructions}`;
        
        const llamaExample = model.toLowerCase().includes('llama') ? 
            `\nIMPORTANT FOR LLAMA:
- DO NOT write out any quiz questions
- DO NOT list any answer options
- DO NOT use A), B), C) format
- Instead, write a description that makes viewers curious about the quiz
- Example: "🎓 Master Your Linux Skills - Interactive Knowledge Check!

Test your command-line expertise with our comprehensive Linux quiz! Perfect for both beginners and experienced users looking to validate their skills.

⏱️ What's Inside:
00:00 - Introduction
01:00 - Quiz Overview
02:00 - Skill Level Guide
03:00 - How to Participate

👨‍💻 Join our growing community of tech enthusiasts and prove your Linux mastery!

#LinuxTutorial #TechEducation #CommandLine #LinuxCommunity"` : '';

        const user_prompt = `Generate an engaging YouTube video description for a quiz about ${topic}.
Quiz Type: ${type === 'mcq' ? 'Multiple Choice' : 'Open Ended'}
Additional Context: ${userInput || 'None provided'}

Requirements:
- Create a detailed, SEO-optimized description
- Include timestamps for key sections
- Use relevant keywords naturally
- Add appropriate hashtags
- Include subscription call-to-action
- Structure with clear sections
- Add relevant links and resources
- Maximum 4-5 paragraphs
- Include key education/learning terms
- Encourage participation WITHOUT revealing quiz content${llamaExample}

Format the response in a way that's ready to be used as a YouTube video description, with clear sections and formatting.`;

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
        console.error("Error generating YouTube video description:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to generate YouTube video description" },
            { status: 500 }
        );
    }
} 