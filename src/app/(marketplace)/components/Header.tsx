'use client';

interface HeaderProps {
  title: string;
  subtitle?: string;
}

const Header: React.FC<HeaderProps> = ({ title, subtitle }) => {
  return (
    <div className="flex flex-col gap-1">
      <h2 className="text-lg font-semibold text-neutral-900">{title}</h2>
      {subtitle ? <p className="text-sm text-neutral-500">{subtitle}</p> : null}
    </div>
  );
};

export default Header;