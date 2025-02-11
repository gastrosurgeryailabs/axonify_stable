import { useState } from "react";
import { UseFormReturn } from "react-hook-form";
import { FormControl, FormField, FormItem, FormLabel, FormDescription, FormMessage } from "./ui/form";
import { Textarea } from "./ui/textarea";
import { Button } from "./ui/button";
import { Loader2 } from "lucide-react";
import axios from "axios";
import { useToast } from "@/hooks/use-toast";

interface BlueskySectionProps {
    form: UseFormReturn<any>;
}

const BlueskySection = ({ form }: BlueskySectionProps) => {
    const [isGenerating, setIsGenerating] = useState(false);
    const { toast } = useToast();
    const quizUrl = form.watch('gameId') ? 
        `https://axonify.vercel.app/play/${form.watch('type')}/${form.watch('gameId')}` 
        : '';

    return (
        <div className="space-y-4">
            <FormField
                control={form.control}
                name="socialMedia.bluesky.message"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Post Content</FormLabel>
                        <FormControl>
                            <div className="space-y-2">
                                <Textarea
                                    placeholder={`Write your Bluesky post here. Quiz link: '${quizUrl}'`}
                                    maxLength={300}
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
                                            const response = await axios.post('/api/social/bluesky/generate-message', {
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
                                                message = message.replace(/^\*\*Post:\*\*\s*/i, '');
                                                
                                                if (message.includes("link in bio")) {
                                                    message = message.replace(
                                                        /👇\s*\*\*Click the link in our bio[^!]*!\*\*\s*👇/,
                                                        `🎯 Take the quiz now: ${quizUrl} 🎯`
                                                    );
                                                } else if (!message.includes(quizUrl)) {
                                                    message += `\n\n🔵 Try the quiz: ${quizUrl}`;
                                                }
                                                
                                                // Add Bluesky-specific hashtags if not present
                                                if (!message.includes('#QuizTime')) {
                                                    message += `\n\n#QuizTime #Learning #Education`;
                                                }
                                                
                                                // Ensure message is within Bluesky's limit
                                                if (message.length > 300) {
                                                    message = message.substring(0, 297) + "...";
                                                }
                                                
                                                form.setValue("socialMedia.bluesky.message", message);
                                            } else {
                                                throw new Error(response.data.error || "Failed to generate post");
                                            }
                                        } catch (error) {
                                            console.error("Bluesky post generation error:", error);
                                            toast({
                                                title: "Generation Failed",
                                                description: error instanceof Error ? error.message : "Failed to generate post. Please try again.",
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
                                        "Generate Post with AI"
                                    )}
                                </Button>
                            </div>
                        </FormControl>
                        <FormDescription>
                            Write a post for your Bluesky feed. The quiz link will be automatically included in the post.
                        </FormDescription>
                        <FormMessage />
                    </FormItem>
                )}
            />
        </div>
    );
}

export default BlueskySection; 