'use client';

import { IconType } from "react-icons";

interface CategoryViewProps {
    icon?: IconType,
    imageSrc?: string | null,
    label: string,
    description: string
}

const CategoryView: React.FC<CategoryViewProps> = ({
    icon: Icon,
    imageSrc,
    label,
    description
}) => {
    return (
        <div className="flex flex-col gap-6 p-5">
            <div className="shadow-md rounded-xl px-10 py-5 flex flex-row items-center gap-4">
                {Icon ? (
                    <div className="aspect-square text-neutral-700 text-2xl flex items-center justify-center h-12 w-12 rounded-full bg-neutral-50 shadow-inner">
                        <Icon size={30} />
                    </div>
                ) : imageSrc ? (
                    <div className="h-12 w-12 rounded-full overflow-hidden bg-neutral-200">
                        <img
                            src={imageSrc}
                            alt="Avatar"
                            className="object-cover w-full h-full"
                        />
                    </div>
                ) : null}
                <div className="flex flex-col">
                    <div className="text-lg font-semibold">
                        {label}
                    </div>
                    <div className="text-neutral-500 font-light">
                        {description}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default CategoryView;