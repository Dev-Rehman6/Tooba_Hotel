// Custom Pakistani Rupee Icon Component
// Money Bag with Rs Symbol

const PakistaniRupeeIcon = ({ size = 24, color = "currentColor", strokeWidth = 2, ...props }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      {/* Money Bag Shape - Larger and cleaner */}
      {/* Bag body - rounded bottom */}
      <path d="M 5 10 Q 5 21 12 21 Q 19 21 19 10" strokeWidth={strokeWidth} />
      
      {/* Bag left side */}
      <path d="M 5 10 L 5 8 Q 5 6 7 5" strokeWidth={strokeWidth} />
      
      {/* Bag right side */}
      <path d="M 19 10 L 19 8 Q 19 6 17 5" strokeWidth={strokeWidth} />
      
      {/* Bag top/neck */}
      <path d="M 7 5 Q 9.5 3 12 3 Q 14.5 3 17 5" strokeWidth={strokeWidth} />
      
      {/* Tie/knot at top */}
      <path d="M 10 3 Q 10 2 12 2 Q 14 2 14 3" strokeWidth={strokeWidth} />
      <line x1="10" y1="2" x2="9" y2="1" strokeWidth={strokeWidth} />
      <line x1="14" y1="2" x2="15" y2="1" strokeWidth={strokeWidth} />
      
      {/* Rs text inside the bag - Thin and clear */}
      {/* R letter */}
      <path d="M 9 13 L 9 17" strokeWidth={strokeWidth * 0.6} />
      <path d="M 9 13 L 11 13 Q 11.5 13 11.5 14 Q 11.5 15 9 15" strokeWidth={strokeWidth * 0.6} />
      <line x1="10.5" y1="15" x2="11.5" y2="17" strokeWidth={strokeWidth * 0.6} />
      
      {/* s letter - reversed */}
      <path d="M 14.5 14 Q 14.5 13 13.5 13 Q 12.5 13 12.5 14 Q 12.5 15 13.5 15 Q 14.5 15 14.5 16 Q 14.5 17 13.5 17 Q 12.5 17 12.5 16" strokeWidth={strokeWidth * 0.6} />
    </svg>
  );
};

export default PakistaniRupeeIcon;
