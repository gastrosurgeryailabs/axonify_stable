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
        console.error("Error generating YouTube video description:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to generate YouTube video description" },
            { status: 500 }
        );
    }
} 