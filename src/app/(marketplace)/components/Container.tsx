'use client';

import clsx from 'clsx';
import { type ReactNode } from 'react';

interface ContainerProps {
  children: ReactNode;
  className?: string;
}

const Container: React.FC<ContainerProps> = ({ children, className }) => {
  return (
    <div
      className={clsx(
        'mx-auto w-full max-w-[2520px] px-0 sm:px-6 lg:px-10',
        className,
      )}
    >
      {children}
    </div>
  );
};

export default Container;