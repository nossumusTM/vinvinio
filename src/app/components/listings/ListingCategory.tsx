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
            <div className="bg-neutral-100 rounded-xl px-10 py-5 flex flex-row items-center gap-4">
                {imageSrc ? (
                    <div className="h-auto w-[50px] rounded-full overflow-hidden bg-neutral-200">
                        <img
                            src={imageSrc}
                            alt="Avatar"
                            className="object-cover w-full h-full"
                        />
                    </div>
                ) : Icon ? (
                    <div className="text-neutral-600 text-2xl">
                        <Icon size={30} />
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