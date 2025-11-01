'use client';

import type { IconType } from 'react-icons';

interface CategoryBoxProps {
    icon: IconType;
    label: string;
    selected?: boolean;
    onClick: (value: string) => void;
}

const CategoryBox: React.FC<CategoryBoxProps> = ({
    icon: Icon,
    label,
    selected,
    onClick
}) => {
    return (
        <button
            type="button"
            onClick={() => onClick(label)}
            aria-pressed={selected}
            className={`
        rounded-2xl
        border-2
        p-4
        flex
        flex-col
        items-center
        gap-3
        hover:border-neutral-900
        transition
        cursor-pointer
        text-center
        ${selected ? 'border-neutral-900 bg-neutral-900/5 shadow-md' : 'border-neutral-200 bg-white/70'}
      `}
        >
            <div className="flex h-14 w-14 items-center justify-center rounded-xl border bg-neutral-50 shadow-sm">
                <Icon className="h-8 w-8 text-neutral-600" aria-hidden="true" />
            </div>
            <div className="font-semibold text-sm">
                {label}
            </div>
        </button>
    );
}

export default CategoryBox;
