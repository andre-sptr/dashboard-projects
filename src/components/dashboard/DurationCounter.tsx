import React, { useState, useEffect } from 'react';
import { calculateCurrentDuration } from '@/utils/duration';

interface Props {
  lastChangedAt: string;
}

export const DurationCounter = ({ lastChangedAt }: Props) => {
  const [duration, setDuration] = useState(() => calculateCurrentDuration(lastChangedAt));

  useEffect(() => {
    const interval = setInterval(() => {
      setDuration(calculateCurrentDuration(lastChangedAt));
    }, 60000);
    return () => clearInterval(interval);
  }, [lastChangedAt]);

  return <>{duration}</>;
};
