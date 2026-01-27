import { useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Film, X, Play } from 'lucide-react';

interface VideoDropzoneProps {
  onVideoSelect: (file: File) => void;
  selectedVideo: string | null;
  onClear: () => void;
  disabled?: boolean;
}

export function VideoDropzone({ onVideoSelect, selectedVideo, onClear, disabled }: VideoDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragIn = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setIsDragging(true);
  }, [disabled]);

  const handleDragOut = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      if (disabled) return;

      const files = e.dataTransfer.files;
      if (files && files.length > 0) {
        const file = files[0];
        if (file.type.startsWith('video/')) {
          onVideoSelect(file);
        }
      }
    },
    [onVideoSelect, disabled]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        onVideoSelect(files[0]);
      }
    },
    [onVideoSelect]
  );

  return (
    <div className="relative">
      <AnimatePresence mode="wait">
        {selectedVideo ? (
          <motion.div
            key="preview"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative rounded-lg overflow-hidden border border-border bg-card"
          >
            <div className="relative w-full h-64 bg-muted/50">
              <img
                src={selectedVideo}
                alt="Video thumbnail"
                className="w-full h-full object-contain"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="p-3 rounded-full bg-background/80 border border-border">
                  <Play className="w-6 h-6 text-primary" />
                </div>
              </div>
            </div>
            <button
              onClick={onClear}
              disabled={disabled}
              className="absolute top-3 right-3 p-2 rounded-full bg-background/80 hover:bg-background border border-border transition-colors disabled:opacity-50"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </motion.div>
        ) : (
          <motion.label
            key="dropzone"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            onDragEnter={handleDragIn}
            onDragLeave={handleDragOut}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`
              relative flex flex-col items-center justify-center
              w-full h-64 rounded-lg border-2 border-dashed
              transition-all duration-300
              ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
              ${
                isDragging
                  ? 'border-primary bg-primary/10 glow-primary'
                  : 'border-border hover:border-primary/50 hover:bg-muted/30'
              }
            `}
          >
            <input
              type="file"
              accept="video/mp4,video/avi,video/webm,video/quicktime"
              onChange={handleFileSelect}
              className="hidden"
              disabled={disabled}
            />
            
            <motion.div
              animate={isDragging ? { scale: 1.1 } : { scale: 1 }}
              className="flex flex-col items-center gap-4"
            >
              <div className="p-4 rounded-full bg-muted">
                {isDragging ? (
                  <Film className="w-8 h-8 text-primary" />
                ) : (
                  <Upload className="w-8 h-8 text-muted-foreground" />
                )}
              </div>
              <div className="text-center">
                <p className="text-foreground font-medium">
                  {isDragging ? 'Drop your video here' : 'Drag & drop a video'}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  or click to browse (MP4, AVI, WebM)
                </p>
              </div>
            </motion.div>
          </motion.label>
        )}
      </AnimatePresence>
    </div>
  );
}
