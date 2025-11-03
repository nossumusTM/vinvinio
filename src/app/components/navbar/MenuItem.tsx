'use client';

import clsx from 'clsx';
import Link from 'next/link';

interface MenuItemProps {
  label: string;
  onClick?: () => void;
  badgeCount?: number;
  className?: string;
  href?: string;
}

const MenuItem: React.FC<MenuItemProps> = ({
  label,
  onClick,
  badgeCount,
  className,
  href,
}) => {
  const baseClasses = clsx(
    'relative flex items-center justify-between px-4 py-2 text-left transition',
    'focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/10',
    className,
  );

  const handleClick = () => {
    onClick?.();
  };

  const badge =
    badgeCount && badgeCount > 0 ? (
      <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#2200ffff] text-[10px] text-white">
        {badgeCount > 99 ? '99+' : badgeCount}
      </span>
    ) : null;

  if (href) {
    return (
      <Link
        href={href}
        onClick={handleClick}
        className={clsx(baseClasses, 'cursor-pointer hover:bg-neutral-100')}
      >
        <span className="flex items-center gap-2">{label}</span>
        {badge}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={clsx(baseClasses, onClick ? 'cursor-pointer hover:bg-neutral-100' : 'cursor-default')}
    >
      <span className="flex items-center gap-2">{label}</span>
      {badge}
    </button>
  );
};

export default MenuItem;
