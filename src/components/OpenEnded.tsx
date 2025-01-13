'use client';

import { cn, formatTimeDelta } from '@/lib/utils';
import { Game, Question } from '@prisma/client'
import { differenceInSeconds } from 'date-fns';
import { BarChart, ChevronRight, Loader2 } from 'lucide-react';
import React from 'react'
import { Card, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button, buttonVariants } from './ui/button';
import { useToast } from '@/hooks/use-toast';
import { useMutation } from '@tanstack/react-query';
import { checkAnswerSchema } from '@/schemas/form/quiz';
import { z } from 'zod';
import axios from 'axios';
import BlankAnswerInput from './BlankAnswerInput';
import Link from 'next/link';
import { playSound } from '@/lib/sounds';
import TopicImage from './TopicImage';
import GameTimer from './GameTimer';
import Image from 'next/image';

type Props = {
    game: Game & {
        questions: Pick<Question, 'id' | 'question' | 'answer'>[],
        completionMessage: string | null
    };
};

const OpenEnded = ({game}: Props) => {
    const [questionIndex, setQuestionIndex] = React.useState(0);
    const [hasEnded, setHasEnded] = React.useState<boolean>(false);
    const [averagePercentage, setAveragePercentage] = React.useState(0);
    const {toast} = useToast();
    const [blankAnswer, setBlankAnswer] = React.useState<string>("");

    const currentQuestion = React.useMemo(() => {
        return game.questions[questionIndex];
    }, [questionIndex, game.questions]);

    const {mutate: endGame} = useMutation({
        mutationFn: async () => {
            const response = await axios.post('/api/endGame', {
                gameId: game.id,
            });
            return response.data;
        },
    });

    const {mutate: checkAnswer, isPending: isChecking} = useMutation({
        mutationFn: async () => {
            let filledAnswer = blankAnswer;
            document.querySelectorAll('#user-blank-input').forEach(input => {
                filledAnswer = filledAnswer.replace("_____", (input as HTMLInputElement).value);
                (input as HTMLInputElement).value = "";
            });
            const payload: z.infer<typeof checkAnswerSchema> = {
                questionId: currentQuestion.id,
                userAnswer: filledAnswer,        
            };
            const response = await axios.post('/api/checkAnswer', payload);
            return response.data;
        },
        onError: (error) => {
            toast({
                title: "Error checking answer",
                description: "Something went wrong. Please try again.",
                variant: "destructive",
            });
            console.error("Answer check error:", error);
        }
    });

    const handleNext = React.useCallback(() => {
        if (isChecking) return;
        
        checkAnswer(undefined, {
            onSuccess: ({percentageSimilar}) => {
                if (percentageSimilar >= 80) {
                    playSound('correct');
                } else {
                    playSound('wrong');
                }
                
                toast({
                    title: `Your answer is ${percentageSimilar}% similar to the correct answer`,
                    description: "Answers are matched based on similarity comparisons",
                });

                setAveragePercentage((prev) => {
                    return (prev + percentageSimilar) / (questionIndex + 1);
                });

                if (questionIndex === game.questions.length - 1) {
                    setHasEnded(true);
                    endGame();
                    return;
                }
                setQuestionIndex((prev) => prev + 1);
            }
        });
    }, [checkAnswer, toast, isChecking, questionIndex, game.questions.length, endGame]);

    React.useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Enter') {
                handleNext();
            }
        };   
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [handleNext]);

    if (hasEnded) {
        return (
            <div className='absolute flex flex-col justify-center top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] md:w-[500px]'>
                {game.completionMessage && (
                    <Card className="mb-4">
                        <CardHeader className="pb-3 pt-3 text-center">
                            <CardDescription className="text-lg font-medium">
                                {game.completionMessage}
                            </CardDescription>
                        </CardHeader>
                    </Card>
                )}
                <Card className="p-4">
                    <CardHeader className="pb-2">
                        <CardTitle>Quiz Completed! 🎉</CardTitle>
                        <CardDescription>
                            You completed in {formatTimeDelta(differenceInSeconds(new Date(), game.timeStarted))}
                        </CardDescription>
                    </CardHeader>
                    <div className="flex flex-col gap-4 mt-4">
                        <Link 
                            href={`/statistics/${game.id}`} 
                            className={cn(buttonVariants({ size: "lg" }))}
                        >
                            View Statistics
                            <BarChart className='w-4 h-4 ml-2'/>
                        </Link>

                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-background px-2 text-muted-foreground">Share this quiz</span>
                            </div>
                        </div>

                        <a 
                            href={`https://wa.me/?text=${encodeURIComponent(
                                `Hey! Check out this awesome quiz on AxonCare!\n\nTopic: ${game.topic}\nType: Open Ended Quiz\nQuestions: ${game.questions.length}\n\nI just completed the quiz with ${averagePercentage.toFixed(1)}% accuracy! Can you beat my score?\n\nTry it out: ${process.env.NEXT_PUBLIC_BASE_URL || (typeof window !== 'undefined' ? window.location.origin : '')}/play/open-ended/${game.id}`
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-2 px-4 py-2 font-semibold text-white transition-colors bg-green-500 rounded-lg hover:bg-green-600"
                        >
                            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                            </svg>
                            Share on WhatsApp
                        </a>
                    </div>
                </Card>

                <Card className="p-4 mt-4">
                    <div className="flex flex-col items-center justify-center gap-2">
                        <Image
                            src="/logo.png"
                            alt="AxonCare Logo"
                            width={63}
                            height={50}
                            className="w-29 h-18"
                        />
                        <div className="flex flex-col items-center">
                            <p className='text-2xl font-bold tracking-wide text-[#0A2472] dark:text-[#1E40AF]'>
                                AxonCare
                            </p>
                            <p className="text-[10px] tracking-[0.2em] text-gray-500 dark:text-gray-400 font-light -mt-0.5">
                                Health • Care • Live
                            </p>
                        </div>

                        <div className="mt-3 text-center">
                            <p className="text-sm text-muted-foreground leading-relaxed max-w-md">
                                AxonCare, a service brand by AxonCare, is a global healthcare network that connects doctors and patients worldwide through cutting-edge technology solutions.
                            </p>
                            <a 
                                href="https://axoncare.io/" 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="mt-3 inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                            >
                                Visit AxonCare
                                <svg className="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                </svg>
                            </a>
                        </div>
                    </div>
                </Card>
            </div>
        );
    }

    return (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 md:w-[80vw] max-w-4xl w-[90vw] p-4">
            <div className="flex flex-col space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                    <div className="flex flex-col">
                        <p>
                            <span className='text-slate-400'>Topic</span> &nbsp;
                            <span className='px-2 py-1 text-white rounded-lg bg-slate-800'>{game.topic}</span>
                        </p>
                        <GameTimer gameStarted={game.timeStarted} />
                    </div>
                    <div className="flex items-center font-semibold mt-4 sm:mt-0">
                        Average Accuracy: {averagePercentage.toFixed(1)}%
                    </div>
                </div>

                <TopicImage topic={game.topic} />

                <Card className='w-full mt-4'>
                    <CardHeader className='flex flex-row items-center'>
                        <CardTitle className='mr-5 text-center divide-y divide-zinc-600/50'>
                            <div>{questionIndex + 1}</div>
                            <div className='text-base text-slate-400'>
                                {game.questions.length}
                            </div>
                        </CardTitle>
                        <CardDescription className='flex-grow text-lg'>
                            {currentQuestion.question}
                        </CardDescription>
                    </CardHeader>
                </Card>

                <div className="flex flex-col items-center justify-center w-full mt-4 space-y-4">
                    <BlankAnswerInput 
                        answer={currentQuestion.answer} 
                        setBlankAnswer={setBlankAnswer} 
                    />
                    <Button 
                        className='mt-4'
                        disabled={isChecking}
                        onClick={() => handleNext()}
                    >
                        {isChecking && <Loader2 className='w-4 h-4 mr-2 animate-spin'/>}
                        Next <ChevronRight className='w-4 h-4 ml-2' />
                    </Button>
                </div>
            </div>
        </div>
    );
}

export default OpenEnded;