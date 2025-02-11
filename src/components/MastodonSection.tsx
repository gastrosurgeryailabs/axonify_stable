import { useState } from "react";
import { UseFormReturn } from "react-hook-form";
import { FormControl, FormField, FormItem, FormLabel, FormDescription, FormMessage } from "./ui/form";
import { Textarea } from "./ui/textarea";
import { Button } from "./ui/button";
import { Loader2 } from "lucide-react";
import axios from "axios";
import { useToast } from "@/hooks/use-toast";

interface MastodonSectionProps {
    form: UseFormReturn<any>;
}

const MastodonSection = ({ form }: MastodonSectionProps) => {
    const [isGenerating, setIsGenerating] = useState(false);
    const { toast } = useToast();
    const quizUrl = form.watch('gameId') ? 
        `https://axonify.vercel.app/play/${form.watch('type')}/${form.watch('gameId')}` 
        : '';

    return (
        <div className="space-y-4">
            <FormField
                control={form.control}
                name="socialMedia.mastodon.message"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Toot Content</FormLabel>
                        <FormControl>
                            <div className="space-y-2">
                                <Textarea
                                    placeholder={`Write your Mastodon toot here. Quiz link: '${quizUrl}'`}
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
                                            const response = await axios.post('/api/social/mastodon/generate-message', {
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
                                                message = message.replace(/^\*\*Toot:\*\*\s*/i, '');
                                                
                                                if (message.includes("link in bio")) {
                                                    message = message.replace(
                                                        /👇\s*\*\*Click the link in our bio[^!]*!\*\*\s*👇/,
                                                        `🎯 Take the quiz now: ${quizUrl} 🎯`
                                                    );
                                                } else if (!message.includes(quizUrl)) {
                                                    message += `\n\n🎯 Join the learning journey: ${quizUrl}`;
                                                }
                                                
                                                // Add Mastodon-specific hashtag if not present
                                                if (!message.includes('#Fediverse')) {
                                                    message += `\n\n#Fediverse #Education #Learning`;
                                                }
                                                
                                                // Ensure message is within Mastodon's limit
                                                if (message.length > 500) {
                                                    message = message.substring(0, 497) + "...";
                                                }
                                                
                                                form.setValue("socialMedia.mastodon.message", message);
                                            } else {
                                                throw new Error(response.data.error || "Failed to generate toot");
                                            }
                                        } catch (error) {
                                            console.error("Mastodon toot generation error:", error);
                                            toast({
                                                title: "Generation Failed",
                                                description: error instanceof Error ? error.message : "Failed to generate toot. Please try again.",
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
                                        "Generate Toot with AI"
                                    )}
                                </Button>
                            </div>
                        </FormControl>
                        <FormDescription>
                            Write a toot for your Mastodon post. The quiz link will be automatically included in the toot.
                        </FormDescription>
                        <FormMessage />
                    </FormItem>
                )}
            />
        </div>
    );
}

export default MastodonSection; 