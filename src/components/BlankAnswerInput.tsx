import React from 'react'

type Props = {
    answer: string;
    setBlankAnswer: React.Dispatch<React.SetStateAction<string>>;
}

const blank = "_____";

const BlankAnswerInput = ({answer, setBlankAnswer}: Props) => {
    const [processedAnswer, setProcessedAnswer] = React.useState(answer);

    React.useEffect(() => {
        // Extract terms marked with [[...]]
        const terms = answer.match(/\[\[(.*?)\]\]/g)?.map(term => term.slice(2, -2)) || [];
        
        // Replace marked terms with blanks
        let modifiedAnswer = answer;
        terms.forEach(term => {
            // Replace the [[term]] syntax with blank
            modifiedAnswer = modifiedAnswer.replace(`[[${term}]]`, blank);
        });

        setProcessedAnswer(modifiedAnswer);
        setBlankAnswer(modifiedAnswer);
    }, [answer, setBlankAnswer]);

    return (
        <div className="flex flex-wrap justify-center w-full mt-4">
            <div className="text-xl font-semibold flex flex-wrap items-center gap-2">
                {processedAnswer.split(blank).map((part, index, array) => (
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