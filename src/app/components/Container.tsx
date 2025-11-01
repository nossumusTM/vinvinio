'use client';

interface ContatinerProps {
    children: React.ReactNode;
}

const Container: React.FC<ContatinerProps> = ({ children }) => {
    return (
        <div
            className="max-w-[2520px]
                        mx-auto
                        
                        px-4">
            {children}
        </div>);
}

export default Container;