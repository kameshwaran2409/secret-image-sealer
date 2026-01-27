import { motion } from 'framer-motion';
import { Image, Film } from 'lucide-react';

export type MediaType = 'image' | 'video';

interface MediaTypeToggleProps {
  mediaType: MediaType;
  onMediaTypeChange: (type: MediaType) => void;
}

export function MediaTypeToggle({ mediaType, onMediaTypeChange }: MediaTypeToggleProps) {
  return (
    <div className="relative flex bg-muted/50 rounded-lg p-1 mb-4">
      <motion.div
        className="absolute top-1 bottom-1 w-[calc(50%-4px)] bg-primary/20 border border-primary/30 rounded-md"
        initial={false}
        animate={{
          x: mediaType === 'image' ? 0 : 'calc(100% + 4px)',
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      />
      
      <button
        onClick={() => onMediaTypeChange('image')}
        className={`
          relative z-10 flex items-center justify-center gap-2 flex-1 py-2 px-3
          rounded-md font-medium text-xs transition-colors
          ${mediaType === 'image' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}
        `}
      >
        <Image className="w-3.5 h-3.5" />
        Image
      </button>
      
      <button
        onClick={() => onMediaTypeChange('video')}
        className={`
          relative z-10 flex items-center justify-center gap-2 flex-1 py-2 px-3
          rounded-md font-medium text-xs transition-colors
          ${mediaType === 'video' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}
        `}
      >
        <Film className="w-3.5 h-3.5" />
        Video
      </button>
    </div>
  );
}
