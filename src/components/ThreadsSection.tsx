import { useState } from "react";
import { UseFormReturn } from "react-hook-form";
import { FormControl, FormField, FormItem, FormLabel, FormDescription, FormMessage } from "./ui/form";
import { Textarea } from "./ui/textarea";
import { Button } from "./ui/button";
import { Loader2 } from "lucide-react";
import axios from "axios";
import { useToast } from "@/hooks/use-toast";
import { getQuizUrl } from '@/lib/utils';

interface ThreadsSectionProps {
    form: UseFormReturn<any>;
}

const ThreadsSection = ({ form }: ThreadsSectionProps) => {
    const [isGenerating, setIsGenerating] = useState(false);
    const { toast } = useToast();
    const quizUrl = getQuizUrl(form.watch('type'), form.watch('gameId'));

    return (
        <div className="space-y-4">
            <FormField
                control={form.control}
                name="socialMedia.threads.message"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Thread Content</FormLabel>
                        <FormControl>
                            <div className="space-y-2">
                                <Textarea
                                    placeholder={`Write your Threads post here. Quiz link: '${quizUrl}'`}
                                    maxLength={500}
                                    {...field}
                                />
                                <Button
                                    type="button"
                                    variant="secondary"
                                    className="w-full"
                                    disabled={isGenerating || !form.watch('initialized')}
                                    onClick={async () => {
                                        try {
                                            setIsGenerating(true);
                                            const response = await axios.post('/api/social/threads/generate-message', {
                                                topic: form.getValues("topic"),
                                                type: form.getValues("type"),
                                                userInput: field.value || "",
                                                apiKey: form.getValues("apiKey"),
                                                model: form.getValues("model"),
                                                serverUrl: form.getValues("serverUrl"),
                                                quizUrl,
                                                messageType: "direct_link"
                                            });
                                            
                                            if (response.data.success && response.data.message) {
                                                let message = response.data.message;
                                                message = message.replace(/^\*\*Thread:\*\*\s*/i, '');
                                                
                                                if (message.includes("link in bio")) {
                                                    message = message.replace(
                                                        /👇\s*\*\*Click the link in our bio[^!]*!\*\*\s*👇/,
                                                        `🎯 Take the quiz now: ${quizUrl} 🎯`
                                                    );
                                                } else if (!message.includes(quizUrl)) {
                                                    message += `\n\n✨ Challenge yourself: ${quizUrl}`;
                                                }
                                                
                                                // Add Threads-specific hashtags if not present
                                                if (!message.includes('#QuizTime')) {
                                                    message += `\n\n#QuizTime #LearnTogether #Education`;
                                                }
                                                
                                                // Ensure message is within Threads' limit
                                                if (message.length > 500) {
                                                    message = message.substring(0, 497) + "...";
                                                }
                                                
                                                form.setValue("socialMedia.threads.message", message);
                                            } else {
                                                throw new Error(response.data.error || "Failed to generate thread");
                                            }
                                        } catch (error) {
                                            console.error("Threads post generation error:", error);
                                            toast({
                                                title: "Generation Failed",
                                                description: error instanceof Error ? error.message : "Failed to generate thread. Please try again.",
                                                variant: "destructive",
                                            });
                                        } finally {
                                            setIsGenerating(false);
                                        }
                                    }}
                                >
                                    {isGenerating ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Generating...
                                        </>
                                    ) : (
                                        "Generate Thread with AI"
                                    )}
                                </Button>
                            </div>
                        </FormControl>
                        <FormDescription>
                            Write a post for your Threads thread. The quiz link will be automatically included in the post.
                        </FormDescription>
                        <FormMessage />
                    </FormItem>
                )}
            />
        </div>
    );
}

export default ThreadsSection; 