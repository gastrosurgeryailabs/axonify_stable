import { FormControl, FormField, FormItem, FormLabel } from "./ui/form";
import {
    Command,
    CommandGroup,
    CommandList,
} from "./ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Button } from "./ui/button";
import { ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { UseFormReturn } from "react-hook-form";
import { useState } from "react";
import { Checkbox } from "./ui/checkbox";

interface PlatformSelectorProps {
    form: UseFormReturn<any>;
}

type Platform = {
    value: string;
    label: string;
};

const PLATFORMS: Platform[] = [
    { value: "instagram", label: "Instagram" },
    { value: "facebook", label: "Facebook" },
    { value: "linkedin", label: "LinkedIn" },
    { value: "twitter", label: "Twitter/X" },
    { value: "tiktok", label: "TikTok" },
    { value: "pinterest", label: "Pinterest" },
    { value: "youtube", label: "YouTube" },
    { value: "mastodon", label: "Mastodon" },
    { value: "threads", label: "Threads" },
    { value: "bluesky", label: "Bluesky" }
];

const PlatformSelector = ({ form }: PlatformSelectorProps) => {
    const [open, setOpen] = useState(false);

    const handleSelect = (platformValue: string) => {
        const currentValue = form.getValues("socialMedia.selectedPlatforms") || [];
        const newValue = currentValue.includes(platformValue)
            ? currentValue.filter((value: string) => value !== platformValue)
            : [...currentValue, platformValue];
        form.setValue("socialMedia.selectedPlatforms", newValue);
    };

    const handleSelectAll = () => {
        const allSelected = PLATFORMS.every(platform => 
            (form.getValues("socialMedia.selectedPlatforms") || []).includes(platform.value)
        );
        
        if (allSelected) {
            form.setValue("socialMedia.selectedPlatforms", []);
        } else {
            form.setValue("socialMedia.selectedPlatforms", PLATFORMS.map(p => p.value));
        }
    };

    return (
        <FormField
            control={form.control}
            name="socialMedia.selectedPlatforms"
            render={({ field }) => (
                <FormItem>
                    <FormLabel>Select Platforms</FormLabel>
                    <Popover open={open} onOpenChange={setOpen}>
                        <PopoverTrigger asChild>
                            <FormControl>
                                <Button
                                    variant="outline"
                                    role="combobox"
                                    aria-expanded={open}
                                    className={cn(
                                        "w-full justify-between",
                                        !field.value?.length && "text-muted-foreground"
                                    )}
                                >
                                    {field.value?.length > 0
                                        ? `${field.value.length} platform${field.value.length === 1 ? "" : "s"} selected`
                                        : "Select platforms"}
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                            </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-0" align="start">
                            <Command>
                                <CommandList>
                                    <div className="border-b px-3 py-2">
                                        <div 
                                            className="flex items-center space-x-2 cursor-pointer"
                                            onClick={(e) => {
                                                // Prevent click if clicking on checkbox
                                                if (e.target === e.currentTarget) {
                                                    handleSelectAll();
                                                }
                                            }}
                                        >
                                            <Checkbox 
                                                checked={PLATFORMS.every(platform => 
                                                    (field.value || []).includes(platform.value)
                                                )}
                                                onCheckedChange={() => handleSelectAll()}
                                                className="mr-2"
                                            />
                                            <span className="font-medium">Select All</span>
                                        </div>
                                    </div>
                                    <CommandGroup>
                                        {PLATFORMS.map((platform) => {
                                            const isSelected = (field.value || []).includes(platform.value);
                                            return (
                                                <div
                                                    key={platform.value}
                                                    className="flex items-center px-3 py-2 cursor-pointer hover:bg-accent"
                                                    onClick={(e) => {
                                                        // Prevent click if clicking on checkbox
                                                        if (e.target === e.currentTarget) {
                                                            handleSelect(platform.value);
                                                        }
                                                    }}
                                                >
                                                    <Checkbox 
                                                        checked={isSelected}
                                                        onCheckedChange={() => handleSelect(platform.value)}
                                                        className="mr-2"
                                                    />
                                                    <span 
                                                        onClick={() => handleSelect(platform.value)}
                                                        className="flex-1"
                                                    >
                                                        {platform.label}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </CommandGroup>
                                </CommandList>
                            </Command>
                        </PopoverContent>
                    </Popover>
                </FormItem>
            )}
        />
    );
};

export default PlatformSelector; 