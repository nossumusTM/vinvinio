'use client';

// interface MenuItemProps {
//     onClick: () => void;
//     label: React.ReactNode; // ✅ allow JSX
// }


// const MenuItem: React.FC<MenuItemProps> = ({
//     onClick,
//     label
// }) => {
//     return (
//         <div
//             onClick={onClick}
//             className="
//             px-4
//             py-3
//             hover:bg-neutral-100
//             transition
//             font-semibold"
//         >
//             {label}
//         </div>
//     );
// }

// export default MenuItem;

interface MenuItemProps {
    label: string;
    onClick: () => void;
    badgeCount?: number;
  }
  
  const MenuItem: React.FC<MenuItemProps> = ({ label, onClick, badgeCount }) => {
    return (
      <div onClick={onClick} className="relative px-4 py-2 hover:bg-neutral-100 transition cursor-pointer flex items-center justify-between">
        <span>{label}</span>
        {badgeCount && badgeCount > 0 && (
          <span 
          className="text-white w-4 h-4 text-[10px] rounded-full flex justify-center items-center"
          style={{
            background: 'linear-gradient(135deg, #3604ff, #04aaff, #3604ff',
          }}
          >
            {badgeCount > 99 ? '99+' : badgeCount}
          </span>
        )}
      </div>
    );
  };  

export default MenuItem;