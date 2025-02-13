export const getQuizUrl = (type: string, gameId: string): string => {
    return `https://axonify-quiz.vercel.app/play/${type === 'open_ended' ? 'open-ended' : 'mcq'}/${gameId}`;
}; 