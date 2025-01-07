import React from 'react'
import keyword_extractor from 'keyword-extractor';

type Props = {
    answer: string;
    setBlankAnswer: React.Dispatch<React.SetStateAction<string>>;
}

const blank = "_____";

// Common words that should never be blanked out
const COMMON_WORDS = new Set([
    'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i', 'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you',
    'do', 'at', 'this', 'but', 'his', 'by', 'from', 'they', 'we', 'say', 'her', 'she', 'or', 'an', 'will', 'my', 'one',
    'all', 'would', 'there', 'their', 'what', 'so', 'up', 'out', 'if', 'about', 'who', 'get', 'which', 'go', 'me',
    'when', 'make', 'can', 'like', 'time', 'no', 'just', 'him', 'know', 'take', 'into', 'year', 'your', 'good',
    'some', 'could', 'them', 'see', 'other', 'than', 'then', 'now', 'look', 'only', 'come', 'its', 'over', 'think',
    'also', 'back', 'after', 'use', 'two', 'how', 'our', 'work', 'first', 'well', 'way', 'even', 'new', 'want',
    'because', 'any', 'these', 'give', 'most', 'us', 'is', 'are', 'was', 'were', 'been', 'has', 'had', 'should',
    'used', 'using', 'each', 'while', 'where'
]);

const BlankAnswerInput = ({answer, setBlankAnswer}: Props) => {
    const keywords = React.useMemo(() => {
        const words = keyword_extractor.extract(answer, {
            language: "english",
            remove_digits: true,
            return_changed_case: false,
            remove_duplicates: true,
        });

        // Filter out common words and short words
        const significantWords = words.filter(word => 
            word.length > 2 && 
            !COMMON_WORDS.has(word.toLowerCase()) &&
            // Avoid words that are likely verbs ending in 'ing' or 'ed'
            !word.match(/(?:ing|ed)$/)
        );
        
        // Sort by length and importance (prefer technical terms and nouns)
        const sortedWords = significantWords
            .sort((a, b) => {
                // Prefer longer words
                const lengthDiff = b.length - a.length;
                if (lengthDiff !== 0) return lengthDiff;
                
                // Prefer capitalized words (proper nouns)
                const aIsCapitalized = a[0] === a[0].toUpperCase();
                const bIsCapitalized = b[0] === b[0].toUpperCase();
                if (aIsCapitalized !== bIsCapitalized) return bIsCapitalized ? 1 : -1;
                
                return 0;
            })
            .slice(0, 2); // Take exactly 2 most important terms

        return sortedWords;
    }, [answer]);

    const answerWithBlanks = React.useMemo(() => {
        let modifiedAnswer = answer;
        keywords.forEach(keyword => {
            // Use word boundaries to replace only whole words
            const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
            modifiedAnswer = modifiedAnswer.replace(regex, blank);
        });
        setBlankAnswer(modifiedAnswer);
        return modifiedAnswer;
    }, [answer, keywords, setBlankAnswer]);

    return (
        <div className="flex flex-wrap justify-center w-full mt-4">
            <div className="text-xl font-semibold flex flex-wrap items-center gap-2">
                {answerWithBlanks.split(blank).map((part, index, array) => (
                    <React.Fragment key={index}>
                        <span>{part.trim()}</span>
                        {index < array.length - 1 && (
                            <input
                                id="user-blank-input"
                                className="text-center border-b-2 border-black dark:border-white w-28 focus:border-2 focus:border-b-4 focus:outline-none px-2"
                                type="text"
                                placeholder="Type answer..."
                                autoComplete="off"
                            />
                        )}
                    </React.Fragment>
                ))}
            </div>
        </div>
    );
};

export default BlankAnswerInput;