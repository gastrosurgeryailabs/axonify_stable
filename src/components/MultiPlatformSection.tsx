import { useState } from "react";
import { UseFormReturn } from "react-hook-form";
import { FormControl, FormField, FormItem, FormLabel, FormDescription, FormMessage } from "./ui/form";
import { Textarea } from "./ui/textarea";
import { Button } from "./ui/button";
import { Loader2 } from "lucide-react";
import axios from "axios";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

interface MultiPlatformSectionProps {
    form: UseFormReturn<any>;
}

const MultiPlatformSection = ({ form }: MultiPlatformSectionProps) => {
    const [isGenerating, setIsGenerating] = useState(false);
    const { toast } = useToast();
    const quizUrl = form.watch('gameId') ? 
        `https://axonify.vercel.app/play/${form.watch('type')}/${form.watch('gameId')}` 
        : '';

    return (
        <div className="space-y-4">
            {/* General Message Section */}
            <FormField
                control={form.control}
                name="socialMedia.multiplatform.message"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Multi-Platform Content</FormLabel>
                        <FormControl>
                            <div className="space-y-2">
                                <Textarea
                                    placeholder={`Write your content here. It will be adapted for each selected platform. Quiz link: '${quizUrl}'`}
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
                                            const response = await axios.post('/api/social/multiplatform/generate-message', {
                                                topic: form.getValues("topic"),
                                                type: form.getValues("type"),
                                                userInput: field.value || "",
                                                apiKey: form.getValues("apiKey"),
                                                model: form.getValues("model"),
                                                quizUrl,
                                                selectedPlatforms: form.getValues("socialMedia.selectedPlatforms")
                                            });
                                            
                                            if (response.data.general) {
                                                // Set the general multi-platform message
                                                form.setValue("socialMedia.multiplatform.message", response.data.general);
                                                
                                                // Set platform-specific messages
                                                const platforms = form.getValues("socialMedia.selectedPlatforms");
                                                platforms.forEach((platform: string) => {
                                                    if (response.data.platforms[platform]) {
                                                        form.setValue(`socialMedia.${platform}.message`, response.data.platforms[platform]);
                                                    }
                                                });
                                            } else {
                                                throw new Error("No messages received");
                                            }
                                        } catch (error) {
                                            console.error("Error generating content:", error);
                                            toast({
                                                title: "Generation Failed",
                                                description: "Failed to generate content. Please try again.",
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
                                        "Generate Content with AI"
                                    )}
                                </Button>
                            </div>
                        </FormControl>
                        <FormDescription>
                            Write content that will work across all selected platforms. The AI will help create platform-specific versions below.
                        </FormDescription>
                        <FormMessage />
                    </FormItem>
                )}
            />

            {/* Platform-Specific Messages Section */}
            {form.watch("socialMedia.selectedPlatforms")?.length > 0 && (
                <div className="space-y-4 mt-8">
                    <h4 className="text-sm font-medium">Platform-Specific Messages</h4>
                    <div className="grid gap-4 md:grid-cols-2">
                        {form.watch("socialMedia.selectedPlatforms").map((platform: string) => (
                            <Card key={platform}>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-medium capitalize">
                                        {platform} Version
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <FormField
                                        control={form.control}
                                        name={`socialMedia.${platform}.message`}
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormControl>
                                                    <Textarea
                                                        placeholder={`${platform} specific content will appear here`}
                                                        className="min-h-[100px]"
                                                        {...field}
                                                    />
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

export default MultiPlatformSection; 