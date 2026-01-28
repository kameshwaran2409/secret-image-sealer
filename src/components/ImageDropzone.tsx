import { useCallback, useState, forwardRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Image as ImageIcon, X } from 'lucide-react';

interface ImageDropzoneProps {
  onImageSelect: (file: File) => void;
  selectedImage: string | null;
  onClear: () => void;
}

export const ImageDropzone = forwardRef<HTMLDivElement, ImageDropzoneProps>(
  function ImageDropzone({ onImageSelect, selectedImage, onClear }, ref) {
    const [isDragging, setIsDragging] = useState(false);

    const handleDrag = useCallback((e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
    }, []);

    const handleDragIn = useCallback((e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(true);
    }, []);

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

        const files = e.dataTransfer.files;
        if (files && files.length > 0) {
          const file = files[0];
          if (file.type.startsWith('image/')) {
            onImageSelect(file);
          }
        }
      },
      [onImageSelect]
    );

    const handleFileSelect = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) {
          onImageSelect(files[0]);
        }
      },
      [onImageSelect]
    );

    return (
      <div className="relative" ref={ref}>
        <AnimatePresence mode="wait">
          {selectedImage ? (
            <motion.div
              key="preview"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative rounded-lg overflow-hidden border border-border bg-card"
            >
              <img
                src={selectedImage}
                alt="Selected"
                className="w-full h-64 object-contain bg-muted/50"
              />
              <button
                onClick={onClear}
                className="absolute top-3 right-3 p-2 rounded-full bg-background/80 hover:bg-background border border-border transition-colors"
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
                cursor-pointer transition-all duration-300
                ${
                  isDragging
                    ? 'border-primary bg-primary/10 glow-primary'
                    : 'border-border hover:border-primary/50 hover:bg-muted/30'
                }
              `}
            >
              <input
                type="file"
                accept="image/png,image/jpeg"
                onChange={handleFileSelect}
                className="hidden"
              />
              
              <motion.div
                animate={isDragging ? { scale: 1.1 } : { scale: 1 }}
                className="flex flex-col items-center gap-4"
              >
                <div className="p-4 rounded-full bg-muted">
                  {isDragging ? (
                    <ImageIcon className="w-8 h-8 text-primary" />
                  ) : (
                    <Upload className="w-8 h-8 text-muted-foreground" />
                  )}
                </div>
                <div className="text-center">
                  <p className="text-foreground font-medium">
                    {isDragging ? 'Drop your image here' : 'Drag & drop an image'}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    or click to browse (PNG, JPG)
                  </p>
                </div>
              </motion.div>
            </motion.label>
          )}
        </AnimatePresence>
      </div>
    );
  }
);
