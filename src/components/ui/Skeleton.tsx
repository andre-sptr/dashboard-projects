import React from 'react';

interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  circle?: boolean;
}

export const Skeleton = ({
  className = '',
  width,
  height,
  circle = false,
}: SkeletonProps) => {
  return (
    <div
      className={`animate-pulse bg-gray-200 dark:bg-gray-800 ${
        circle ? 'rounded-full' : 'rounded-md'
      } ${className}`}
      style={{
        width: width || '100%',
        height: height || '1rem',
      }}
    />
  );
};
