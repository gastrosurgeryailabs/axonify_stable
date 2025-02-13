import { getAuthSession } from "@/lib/nextauth";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import { z } from "zod";

const credentialsSchema = z.object({
    anythingLLMUrl: z.string().min(1),
    anythingLLMKey: z.string().min(1),
});

// GET endpoint to retrieve credentials
export async function GET() {
    try {
        const session = await getAuthSession();
        if (!session?.user) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const credentials = await prisma.userCredentials.findUnique({
            where: { userId: session.user.id },
            select: {
                anythingLLMUrl: true,
                anythingLLMKey: true,
            },
        });

        return NextResponse.json(credentials);
    } catch (error) {
        console.error("Error fetching credentials:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

// POST endpoint to save credentials
export async function POST(req: Request) {
    try {
        const session = await getAuthSession();
        if (!session?.user) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const body = await req.json();
        const { anythingLLMUrl, anythingLLMKey } = credentialsSchema.parse(body);

        const credentials = await prisma.userCredentials.upsert({
            where: { userId: session.user.id },
            update: {
                anythingLLMUrl,
                anythingLLMKey,
            },
            create: {
                userId: session.user.id,
                anythingLLMUrl,
                anythingLLMKey,
            },
        });

        return NextResponse.json({
            message: "Credentials saved successfully",
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: "Invalid request data" },
                { status: 400 }
            );
        }
        console.error("Error saving credentials:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
} 