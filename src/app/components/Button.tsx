'use client';

import { IconType } from "react-icons";

interface ButtonProps {
    label: string;
    onClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
    disabled?: boolean;
    outline?: boolean;
    small?: boolean;
    icon?: IconType;
}

const Button: React.FC<ButtonProps> = ({
    label,
    onClick,
    disabled,
    outline,
    small,
    icon: Icon,
}) => {
    return (
    <button
        disabled={disabled}
        onClick={onClick}
        className={`
            relative
            disabled:opacity-70
            disabled:cursor-not-allowed
            rounded-xl
            hover:opacity-80
            transition
            w-full
            ${outline ? 'bg-white' : 'text-white'}
            ${outline ? 'border-black text-black' : ''}
            ${small ? 'text-sm' : 'text-md'}
            ${small ? 'py-1' : 'py-3'}
            ${small ? 'font-light' : 'font-semibold'}
            ${small ? 'border-[1px]' : 'border-2'}
        `}
        style={{
            backgroundColor: outline ? 'white' : '#000',
            borderColor: outline ? 'black' : '#000'
        }}
        >
        {Icon && (
            <Icon
            size={24}
            className="absolute left-4 top-3"
            />
        )}
        {label}
    </button>
    );
}

export default Button;