import { useState } from "react";

const LocationDescription: React.FC<{ text: string }> = ({ text }) => {
    const [expanded, setExpanded] = useState(false);
    const words = text.split(' ');
    const shortText = words.slice(0, 24).join(' ');
  
    return (
      <div className="text-sm text-neutral-700 whitespace-pre-line">
        {expanded ? text : shortText + (words.length > 24 ? '...' : '')}
        {words.length > 24 && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="ml-2 text-black underline font-medium"
          >
            {expanded ? 'Show less' : 'Read more'}
          </button>
        )}
      </div>
    );
  };
  
  export default LocationDescription; // ✅ this is key
  