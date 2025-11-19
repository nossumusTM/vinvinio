'use client';

import { IconType } from "react-icons";

interface ButtonProps {
    label: string;
    onClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
    disabled?: boolean;
    outline?: boolean;
    small?: boolean;
    icon?: IconType;
    loading?: boolean;
}

const Button: React.FC<ButtonProps> = ({
    label,
    onClick,
    disabled,
    outline,
    small,
    icon: Icon,
    loading,
}) => {
    return (
    <button
        disabled={disabled || loading}
        onClick={onClick}
        className={`
            relative
            disabled:opacity-70
            disabled:cursor-not-allowed
            rounded-xl
            hover:opacity-80
            transition
            w-full
            px-4
            py-2
            ${outline ? 'bg-white' : 'text-white'}
            ${outline ? 'border-black text-black' : ''}
            ${small ? 'text-md' : 'text-lg'}
            ${small ? 'py-1' : 'py-3'}
            ${small ? 'font-normal' : 'font-semibold'}
            ${small ? 'shadow-md' : 'shadow-lg'}
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
        
        {loading ? (
            <span className="flex items-center justify-center gap-2">
                <span
                    className="h-4 w-4 border-2 border-t-transparent rounded-full animate-spin"
                    style={{ borderColor: outline ? '#000' : '#fff', borderTopColor: 'transparent' }}
                ></span>
                <span>{label}</span>
            </span>
        ) : (
            label
        )}
    </button>
    );
}

export default Button;