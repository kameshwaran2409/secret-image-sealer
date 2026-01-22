import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Lock, Download, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ImageDropzone } from './ImageDropzone';
import {
  loadImage,
  encodeText,
  imageDataToBlob,
  downloadBlob,
  calculateCapacity,
} from '@/lib/steganography';

export function EncodePanel() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [secretText, setSecretText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [capacity, setCapacity] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleImageSelect = useCallback((file: File) => {
    setSelectedFile(file);
    setError(null);
    setSuccess(false);
    
    const reader = new FileReader();
    reader.onload = async (e) => {
      const dataUrl = e.target?.result as string;
      setImagePreview(dataUrl);
      
      // Calculate capacity
      try {
        const { width, height } = await loadImage(file);
        setCapacity(calculateCapacity(width, height));
      } catch (err) {
        console.error('Failed to calculate capacity:', err);
      }
    };
    reader.readAsDataURL(file);
  }, []);

  const handleClearImage = useCallback(() => {
    setSelectedFile(null);
    setImagePreview(null);
    setCapacity(null);
    setError(null);
    setSuccess(false);
  }, []);

  const handleEncode = useCallback(async () => {
    if (!selectedFile || !secretText.trim()) return;

    setIsProcessing(true);
    setError(null);
    setSuccess(false);

    try {
      const { imageData } = await loadImage(selectedFile);
      const encodedData = encodeText(imageData, secretText);
      const blob = await imageDataToBlob(encodedData);
      
      const originalName = selectedFile.name.replace(/\.[^/.]+$/, '');
      downloadBlob(blob, `${originalName}_encoded.png`);
      
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Encoding failed');
    } finally {
      setIsProcessing(false);
    }
  }, [selectedFile, secretText]);

  const textLength = secretText.length;
  const isOverCapacity = capacity !== null && textLength > capacity;
  const canEncode = selectedFile && secretText.trim() && !isOverCapacity;

  return (
    <div className="space-y-6">
      <ImageDropzone
        onImageSelect={handleImageSelect}
        selectedImage={imagePreview}
        onClear={handleClearImage}
      />

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-foreground">
            Secret Message
          </label>
          {capacity !== null && (
            <span
              className={`text-xs font-mono ${
                isOverCapacity ? 'text-destructive' : 'text-muted-foreground'
              }`}
            >
              {textLength.toLocaleString()} / {capacity.toLocaleString()} chars
            </span>
          )}
        </div>
        <Textarea
          value={secretText}
          onChange={(e) => {
            setSecretText(e.target.value);
            setSuccess(false);
          }}
          placeholder="Enter the text you want to hide..."
          className="min-h-32 font-mono text-sm bg-muted/30 border-border focus:border-primary resize-none"
        />
      </div>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/30"
        >
          <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0" />
          <span className="text-sm text-destructive">{error}</span>
        </motion.div>
      )}

      {success && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 p-3 rounded-lg bg-success/10 border border-success/30"
        >
          <CheckCircle2 className="w-4 h-4 text-success flex-shrink-0" />
          <span className="text-sm text-success">
            Message encoded successfully! Your file has been downloaded.
          </span>
        </motion.div>
      )}

      <Button
        onClick={handleEncode}
        disabled={!canEncode || isProcessing}
        className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-medium glow-primary disabled:opacity-50 disabled:glow-none"
      >
        {isProcessing ? (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full"
          />
        ) : (
          <>
            <Lock className="w-5 h-5 mr-2" />
            Encode & Download
            <Download className="w-4 h-4 ml-2" />
          </>
        )}
      </Button>
    </div>
  );
}
