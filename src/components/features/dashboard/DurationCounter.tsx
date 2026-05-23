// Countdown or duration display for project sub-status
import React, { useState, useEffect } from 'react';
import { calculateCurrentDuration } from '@/utils/duration';

interface Props {
  lastChangedAt: string;
  className?: string;
}

export const DurationCounter = ({ lastChangedAt, className }: Props) => {
  const [duration, setDuration] = useState(() => calculateCurrentDuration(lastChangedAt));

  useEffect(() => {
    const interval = setInterval(() => {
      setDuration(calculateCurrentDuration(lastChangedAt));
    }, 60000);
    return () => clearInterval(interval);
  }, [lastChangedAt]);

  return <span className={className} title={duration}>{duration}</span>;
};
