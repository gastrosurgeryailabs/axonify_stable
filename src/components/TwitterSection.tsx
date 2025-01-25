import { useState } from "react";
import { UseFormReturn } from "react-hook-form";
import { FormControl, FormField, FormItem, FormLabel, FormDescription, FormMessage } from "./ui/form";
import { Textarea } from "./ui/textarea";
import { Button } from "./ui/button";
import { Loader2 } from "lucide-react";
import axios from "axios";
import { useToast } from "@/hooks/use-toast";

interface TwitterSectionProps {
    form: UseFormReturn<any>;
}

const TwitterSection = ({ form }: TwitterSectionProps) => {
    const [isGenerating, setIsGenerating] = useState(false);
    const { toast } = useToast();
    const quizUrl = form.watch('gameId') ? 
        `https://axonify.vercel.app/play/${form.watch('type')}/${form.watch('gameId')}` 
        : '';

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
                                                quizUrl,
                                                messageType: "direct_link"
                                            });
                                            
                                            if (response.data.message) {
                                                let message = response.data.message;
                                                message = message.replace(/^\*\*Tweet:\*\*\s*/i, '');
                                                
                                                if (message.includes("link in bio")) {
                                                    message = message.replace(
                                                        /👇\s*\*\*Click the link in our bio[^!]*!\*\*\s*👇/,
                                                        `🎯 Take the quiz now: ${quizUrl} 🎯`
                                                    );
                                                } else if (!message.includes(quizUrl)) {
                                                    message += `\n\n🎯 Challenge yourself: ${quizUrl}`;
                                                }
                                                
                                                // Ensure message is within Twitter's limit
                                                if (message.length > 280) {
                                                    message = message.substring(0, 277) + "...";
                                                }
                                                
                                                form.setValue("socialMedia.twitter.message", message);
                                            }
                                        } catch (error) {
                                            toast({
                                                title: "Generation Failed",
                                                description: "Failed to generate tweet. Please try again.",
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