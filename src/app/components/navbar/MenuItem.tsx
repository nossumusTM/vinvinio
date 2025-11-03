'use client';

import { ReactNode } from 'react';
import clsx from 'clsx';
import { useRouter } from 'next/navigation';

interface MenuItemProps {
  label: string;
  onClick?: () => void;
  badgeCount?: number;
  className?: string;
  href?: string;
  icon?: ReactNode;
}

const MenuItem: React.FC<MenuItemProps> = ({
  label,
  onClick,
  badgeCount,
  className,
  href,
  icon,
}) => {
  const router = useRouter();
  const baseClasses = clsx(
    'relative flex w-full items-center justify-between px-4 py-2 text-left transition',
    'focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/10',
    className,
  );

  const handleClick = () => {
    onClick?.();
    if (href) {
      router.push(href);
    }
  };

  const badge =
    badgeCount && badgeCount > 0 ? (
      <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#2200ffff] text-[10px] text-white">
        {badgeCount > 99 ? '99+' : badgeCount}
      </span>
    ) : null;

  const isInteractive = Boolean(onClick || href);

  return (
    <button
      type="button"
      onClick={handleClick}
      className={clsx(
        baseClasses,
        isInteractive ? 'cursor-pointer hover:bg-neutral-100' : 'cursor-default',
      )}
    >
      <span className="flex items-center gap-2">
        {icon && <span className="text-lg text-neutral-600">{icon}</span>}
        <span>{label}</span>
      </span>
      {badge}
    </button>
  );
};

export default MenuItem;
