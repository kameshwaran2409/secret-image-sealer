import { motion } from 'framer-motion';
import { Lock, Unlock } from 'lucide-react';

type Mode = 'encode' | 'decode';

interface ModeToggleProps {
  mode: Mode;
  onModeChange: (mode: Mode) => void;
}

export function ModeToggle({ mode, onModeChange }: ModeToggleProps) {
  return (
    <div className="relative flex bg-muted rounded-lg p-1">
      <motion.div
        className="absolute top-1 bottom-1 w-[calc(50%-4px)] bg-card rounded-md shadow-card glow-primary"
        initial={false}
        animate={{
          x: mode === 'encode' ? 0 : 'calc(100% + 4px)',
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      />
      
      <button
        onClick={() => onModeChange('encode')}
        className={`
          relative z-10 flex items-center justify-center gap-2 flex-1 py-3 px-4
          rounded-md font-medium text-sm transition-colors
          ${mode === 'encode' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}
        `}
      >
        <Lock className="w-4 h-4" />
        Encode
      </button>
      
      <button
        onClick={() => onModeChange('decode')}
        className={`
          relative z-10 flex items-center justify-center gap-2 flex-1 py-3 px-4
          rounded-md font-medium text-sm transition-colors
          ${mode === 'decode' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}
        `}
      >
        <Unlock className="w-4 h-4" />
        Decode
      </button>
    </div>
  );
}
