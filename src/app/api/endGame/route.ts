import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { gameId } = body;

        // Find the game
        const game = await prisma.game.findUnique({
            where: {
                id: gameId,
            },
        });

        if (!game) {
            return NextResponse.json(
                { error: "Game not found" },
                { status: 404 }
            );
        }

        // Update game with end time
        const updatedGame = await prisma.game.update({
            where: {
                id: gameId,
            },
            data: {
                timeEnded: new Date(),
            },
        });

        return NextResponse.json({
            message: "Game ended successfully",
            game: updatedGame,
        });
    } catch (error) {
        console.error("Error ending game:", error);
        return NextResponse.json(
            { error: "Failed to end game" },
            { status: 500 }
        );
    }
} 