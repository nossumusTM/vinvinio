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
    className?: string;
  }
  
  const MenuItem: React.FC<MenuItemProps> = ({ label, onClick, badgeCount, className }) => {

    const isClickable = typeof onClick === 'function';
    
//     return (
//       <div onClick={onClick} className="relative px-4 py-2 hover:bg-neutral-100 transition cursor-pointer flex items-center justify-between">
//         <span>{label}</span>
//         {badgeCount && badgeCount > 0 && (
//           <span 
//           className="text-white w-4 h-4 text-[10px] rounded-full flex justify-center items-center bg-[#2200ffff]"
//           // style={{
//           //   background: 'linear-gradient(135deg, #3604ff, #04aaff, #3604ff',
//           // }}
//           >
//             {badgeCount > 99 ? '99+' : badgeCount}
//           </span>
//         )}
//       </div>
//     );
//   };  

// export default MenuItem;

return (
    <div
      onClick={onClick}
      role={isClickable ? 'button' : 'presentation'}
      tabIndex={isClickable ? 0 : -1}
      onKeyDown={(e) => {
        if (!isClickable) return;
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.();
        }
      }}
      className={[
        'relative px-4 py-2 transition flex items-center justify-between',
        isClickable ? 'hover:bg-neutral-100 cursor-pointer' : 'cursor-default',
        className || ''
      ].join(' ')}
    >
      <span className="flex items-center gap-2">{label}</span>

      {badgeCount && badgeCount > 0 && (
        <span
          className="text-white w-4 h-4 text-[10px] rounded-full flex justify-center items-center bg-[#2200ffff]"
        >
          {badgeCount > 99 ? '99+' : badgeCount}
        </span>
      )}
    </div>
  );
};

export default MenuItem;