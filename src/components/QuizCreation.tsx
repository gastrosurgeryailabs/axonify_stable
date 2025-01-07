'use client';

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { useForm } from 'react-hook-form';
import { quizCreationSchema } from '@/schemas/form/quiz';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from './ui/form';
import { Input } from './ui/input';
import { BookOpen, CopyCheck } from 'lucide-react';
import { Separator } from './ui/separator';
import { Button } from './ui/button';
import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import LoadingQuestions from './LoadingQuestions';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import {ShareButton }from './ShareButton';

type Props = {
    topicParam: string;
}

type Input = z.infer<typeof quizCreationSchema>;

const LANGUAGES = [
    { code: 'en', name: 'English' },
    { code: 'hi', name: 'Hindi' },
    { code: 'es', name: 'Spanish' },
    { code: 'fr', name: 'French' },
    { code: 'de', name: 'German' },
    { code: 'it', name: 'Italian' },
    { code: 'pt', name: 'Portuguese' },
    { code: 'ru', name: 'Russian' },
    { code: 'ja', name: 'Japanese' },
    { code: 'ko', name: 'Korean' },
    { code: 'zh', name: 'Chinese (Simplified)' },
    { code: 'zh-TW', name: 'Chinese (Traditional)' },
    { code: 'ar', name: 'Arabic' },
    { code: 'bn', name: 'Bengali' },
    { code: 'ur', name: 'Urdu' },
    { code: 'te', name: 'Telugu' },
    { code: 'mr', name: 'Marathi' },
    { code: 'ta', name: 'Tamil' },
    { code: 'gu', name: 'Gujarati' },
    { code: 'kn', name: 'Kannada' },
    { code: 'ml', name: 'Malayalam' },
    { code: 'th', name: 'Thai' },
    { code: 'vi', name: 'Vietnamese' },
    { code: 'id', name: 'Indonesian' },
    { code: 'ms', name: 'Malay' },
    { code: 'tr', name: 'Turkish' },
    { code: 'fa', name: 'Persian' },
    { code: 'nl', name: 'Dutch' },
    { code: 'pl', name: 'Polish' },
    { code: 'uk', name: 'Ukrainian' },
    { code: 'cs', name: 'Czech' },
    { code: 'el', name: 'Greek' },
    { code: 'he', name: 'Hebrew' },
    { code: 'ro', name: 'Romanian' },
    { code: 'sv', name: 'Swedish' },
    { code: 'da', name: 'Danish' },
    { code: 'fi', name: 'Finnish' },
    { code: 'no', name: 'Norwegian' },
    { code: 'hu', name: 'Hungarian' },
    { code: 'sk', name: 'Slovak' },
    { code: 'bg', name: 'Bulgarian' },
    { code: 'hr', name: 'Croatian' },
    { code: 'sr', name: 'Serbian' },
    { code: 'sl', name: 'Slovenian' },
    { code: 'et', name: 'Estonian' },
    { code: 'lv', name: 'Latvian' },
    { code: 'lt', name: 'Lithuanian' },
    { code: 'af', name: 'Afrikaans' },
    { code: 'sw', name: 'Swahili' },
    { code: 'tl', name: 'Filipino' }
].sort((a, b) => a.name.localeCompare(b.name));

const QuizCreation = ({topicParam}: Props) => {
    const router = useRouter();
    const { toast } = useToast();
    const [finished, setFinished] = React.useState(false);
    const [showLoader, setShowLoader] = React.useState(false);
    
    const {mutate: getQuestions, isPending} = useMutation({
        mutationFn: async ({amount, topic, type, targetLanguage}: Input) => {
            try {
                const response = await axios.post('/api/game', {
                    amount,
                    topic,
                    type,
                    targetLanguage,
                });
                if (!response.data || !response.data.gameId) {
                    throw new Error('Invalid response from server');
                }
                return response.data;
            } catch (error) {
                if (axios.isAxiosError(error)) {
                    throw new Error(error.response?.data?.error || error.message || 'Failed to create quiz');
                }
                throw error;
            }
        },
        onError: (error: Error) => {
            setShowLoader(false);
            toast({
                title: "Error creating quiz",
                description: error.message || "An unexpected error occurred",
                variant: "destructive",
            });
            console.error("Quiz creation error:", error);
        },
        onSuccess: (data) => {
            setFinished(true);
            setTimeout(() => {
                const gameType = form.getValues("type");
                const urlGameType = gameType === 'open_ended' ? 'open-ended' : gameType;
                router.push(`/play/${urlGameType}/${data.gameId}`);
            }, 1000);
        }
    });

    const form = useForm<Input>({
        resolver: zodResolver(quizCreationSchema),
        defaultValues: {
            amount: 3,
            topic: topicParam,
            type: "mcq",
            targetLanguage: "en"
        }
    });

    function onSubmit(input: Input) {
        setShowLoader(true);
        getQuestions(input);
    }

    if (showLoader) {
        return <LoadingQuestions finished={finished}/>;
    }

    return (
        <div className="absolute -translate-x-1/2 -translate-y-1/2 top-1/2 left-1/2">
            <Card className="w-[400px]">
                <CardHeader>
                    <CardTitle className="text-2xl font-bold">Quiz Creation</CardTitle>
                    <CardDescription>Choose a topic</CardDescription>
                </CardHeader>

                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                            <FormField
                                control={form.control}
                                name="topic"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Topic</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Enter a topic..." {...field} />
                                        </FormControl>
                                        <FormDescription>
                                            Please provide a topic for your quiz.
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="amount"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Number of Questions</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="Enter an amount..."
                                                type="number"
                                                {...field}
                                                onChange={e => field.onChange(parseInt(e.target.value))}
                                            />
                                        </FormControl>
                                        <FormDescription>
                                            You can choose up to 10 questions.
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="targetLanguage"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Quiz Language</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select a language" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {LANGUAGES.map((lang) => (
                                                    <SelectItem key={lang.code} value={lang.code}>
                                                        {lang.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormDescription>
                                            Choose the language for your quiz questions and answers.
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="type"
                                render={({ field }) => (
                                    <FormItem>
                                        <div className="flex justify-between">
                                            <Button
                                                type="button"
                                                onClick={() => {
                                                    form.setValue("type", "mcq");
                                                }}
                                                className="w-1/2 rounded-none rounded-l-lg"
                                                variant={field.value === "mcq" ? "default" : "secondary"}
                                            >
                                                <CopyCheck className="w-4 h-4 mr-2" /> Multiple Choice
                                            </Button>
                                            <Separator orientation="vertical" />
                                            <Button
                                                type="button"
                                                onClick={() => {
                                                    form.setValue("type", "open_ended");
                                                }}
                                                className="w-1/2 rounded-none rounded-r-lg"
                                                variant={field.value === "open_ended" ? "default" : "secondary"}
                                            >
                                                <BookOpen className="w-4 h-4 mr-2" /> Open Ended
                                            </Button>
                                        </div>
                                    </FormItem>
                                )}
                            />

                            <div className="flex flex-col gap-4">
                                <Button disabled={isPending} type="submit" className="w-full">
                                    Submit
                                </Button>
                                <ShareButton topic={form.getValues("topic")} gameId="" />
                            </div>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    );
};

export default QuizCreation;