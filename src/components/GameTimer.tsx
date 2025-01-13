'use client';

import { formatTimeDelta } from '@/lib/utils';
import { Timer } from 'lucide-react';
import { differenceInSeconds } from 'date-fns';
import React from 'react';

type Props = {
    gameStarted: Date;
};

const GameTimer = ({ gameStarted }: Props) => {
    const [now, setNow] = React.useState<Date>(new Date());

    React.useEffect(() => {
        const interval = setInterval(() => {
            setNow(new Date());
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className='flex self-start mt-3 text-slate-400'>
            <Timer className='mr-2' />
            {formatTimeDelta(differenceInSeconds(now, gameStarted))}
        </div>
    );
};

export default GameTimer; 