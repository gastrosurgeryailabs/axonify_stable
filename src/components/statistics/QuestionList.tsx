import { Question } from '@prisma/client'
import React from 'react'
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '../ui/table'
import { cn } from '@/lib/utils'

type Props = {
    questions: Question[]
}

const QuestionList = ({questions}: Props) => {
    let gameType = questions[0].questionType
  return (
    <Table className='mt-4'>
        <TableCaption>End of list.</TableCaption>
        <TableHeader>
            <TableRow>
                <TableHead className='w-[10px]'>No.</TableHead>
                <TableHead>Question & Correct Answer</TableHead>
                <TableHead>Your Answer</TableHead>
                    {gameType === 'open_ended' && (
                        <TableHead className='w-[10px] text-right'>Accuracy</TableHead>
                    )}
            </TableRow>
        </TableHeader>
        <TableBody>
            <>
            {questions.map((question, index) => {
                // Use type assertion to handle the explanation field
                const questionWithExplanation = question as Question & { explanation?: string };
                
                return (
                <TableRow key={question.id}>
                    <TableCell className='font-medium'>
                        {index + 1}
                    </TableCell>
                    <TableCell>
                        {question.question}
                    <br />
                    <br />
                    <span className='font-semibold'>{question.answer}</span>
                    {questionWithExplanation.explanation && (
                        <>
                            <br />
                            <br />
                            <span className='text-sm text-gray-600 italic'>
                                <span className='font-medium not-italic'>Explanation:</span> {questionWithExplanation.explanation}
                            </span>
                        </>
                    )}
                    </TableCell>
                    {gameType === 'mcq' && (
                            <TableCell className={
                                cn({
                                    'text-green-600': question.isCorrect,
                                    'text-red-600': !question.isCorrect,
                            })
                            }>
                                {question.userAnswer}
                            </TableCell>
                    )}
                    {gameType === 'open_ended' && (
                        <TableCell>
                            {question.userAnswer}
                        </TableCell>
                    )}
                    {gameType === 'open_ended' && (
                        <TableCell className='text-right'>
                            {question.percentageCorrect}
                        </TableCell>
                    )}
                </TableRow>
            )})}
            </>
        </TableBody>
    </Table>
  )
}

export default QuestionList;