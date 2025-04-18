'use client';

import qs from 'query-string';
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { IconType } from "react-icons";

interface CategoryBoxProps {
    icon: IconType,
    label: string;
    selected?: boolean;
}

const CategoryBox: React.FC<CategoryBoxProps> = ({
    icon: Icon,
    label,
    selected,
}) => {
    const router = useRouter();
    const params = useSearchParams();

    const handleClick = useCallback(() => {
        let currentQuery = {};

        if (params) {
            currentQuery = qs.parse(params.toString())
        }

        const updatedQuery: any = {
            ...currentQuery,
            category: label
        }

        if (params?.get('category') === label) {
            delete updatedQuery.category;
        }

        const url = qs.stringifyUrl({
            url: '/',
            query: updatedQuery
        }, { skipNull: true });

        router.push(url);
    }, [label, router, params]);

    return (
        <div
            onClick={handleClick}
            className={`
                flex 
                flex-col 
                items-center 
                justify-center 
                gap-2
                min-w-[90px]
                px-4
                py-3
                border-b-2
                hover:bg-neutral-100
                hover:text-neutral-800
                mb-4
                rounded-xl
                transition
                cursor-pointer
                text-center
                ${selected ? 'border-b-neutral-100' : 'border-transparent'}
                ${selected ? 'text-neutral-900' : 'text-neutral-700'}
            `}
            >
            <Icon size={26} />
            <div className="font-medium text-sm whitespace-nowrap text-center leading-tight">
                {label}
            </div>
        </div>
    );
}

export default CategoryBox;