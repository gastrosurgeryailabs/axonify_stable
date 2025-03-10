import { useState } from "react";
import { UseFormReturn } from "react-hook-form";
import { FormControl, FormField, FormItem, FormLabel, FormDescription, FormMessage } from "./ui/form";
import { Textarea } from "./ui/textarea";
import { Button } from "./ui/button";
import { Loader2 } from "lucide-react";
import axios from "axios";
import { useToast } from "@/hooks/use-toast";
import { getQuizUrl } from '@/utils/quizUrl';

interface TwitterSectionProps {
    form: UseFormReturn<any>;
}

const TwitterSection = ({ form }: TwitterSectionProps) => {
    const [isGenerating, setIsGenerating] = useState(false);
    const { toast } = useToast();
    const quizUrl = getQuizUrl(form.watch('type'), form.watch('gameId'));

    return (
        <div className="space-y-4">
            <FormField
                control={form.control}
                name="socialMedia.twitter.message"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Tweet Content</FormLabel>
                        <FormControl>
                            <div className="space-y-2">
                                <Textarea
                                    placeholder={`Write your tweet here. Quiz link: '${quizUrl}'`}
                                    maxLength={280}
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
                                            const response = await axios.post('/api/social/twitter/generate-message', {
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
                                                
                                                // Add quiz URL if not present
                                                if (!message.includes(quizUrl)) {
                                                    // Check remaining characters to ensure we don't exceed 280
                                                    const remainingChars = 280 - message.length;
                                                    const urlSuffix = `\n\n🎯 ${quizUrl}`;
                                                    
                                                    if (remainingChars >= urlSuffix.length) {
                                                        message += urlSuffix;
                                                    } else {
                                                        // If not enough space, try to make room by trimming the message
                                                        message = message.slice(0, 280 - urlSuffix.length) + urlSuffix;
                                                    }
                                                }
                                                
                                                form.setValue("socialMedia.twitter.message", message);
                                            } else {
                                                throw new Error(response.data.error || "Failed to generate tweet");
                                            }
                                        } catch (error) {
                                            console.error("Tweet generation error:", error);
                                            toast({
                                                title: "Generation Failed",
                                                description: error instanceof Error ? error.message : "Failed to generate tweet. Please try again.",
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
                                        "Generate Tweet with AI"
                                    )}
                                </Button>
                            </div>
                        </FormControl>
                        <FormDescription>
                            Write a tweet for your Twitter/X post. The quiz link will be automatically included in the tweet.
                        </FormDescription>
                        <FormMessage />
                    </FormItem>
                )}
            />
        </div>
    );
}

export default TwitterSection; 