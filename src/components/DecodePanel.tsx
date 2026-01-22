import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Unlock, Copy, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ImageDropzone } from './ImageDropzone';
import { loadImage, decodeText } from '@/lib/steganography';

export function DecodePanel() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [decodedText, setDecodedText] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleImageSelect = useCallback((file: File) => {
    setSelectedFile(file);
    setDecodedText(null);
    setError(null);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleClearImage = useCallback(() => {
    setSelectedFile(null);
    setImagePreview(null);
    setDecodedText(null);
    setError(null);
  }, []);

  const handleDecode = useCallback(async () => {
    if (!selectedFile) return;

    setIsProcessing(true);
    setError(null);
    setDecodedText(null);

    try {
      const { imageData } = await loadImage(selectedFile);
      const text = decodeText(imageData);
      setDecodedText(text);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Decoding failed');
    } finally {
      setIsProcessing(false);
    }
  }, [selectedFile]);

  const handleCopy = useCallback(async () => {
    if (!decodedText) return;
    
    await navigator.clipboard.writeText(decodedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [decodedText]);

  return (
    <div className="space-y-6">
      <ImageDropzone
        onImageSelect={handleImageSelect}
        selectedImage={imagePreview}
        onClear={handleClearImage}
      />

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

      {decodedText !== null && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-3"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-success" />
              <span className="text-sm font-medium text-success">
                Hidden message found!
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopy}
              className="text-muted-foreground hover:text-foreground"
            >
              <Copy className="w-4 h-4 mr-1" />
              {copied ? 'Copied!' : 'Copy'}
            </Button>
          </div>
          <div className="p-4 rounded-lg bg-muted/30 border border-border">
            <p className="font-mono text-sm text-foreground whitespace-pre-wrap break-words">
              {decodedText}
            </p>
          </div>
        </motion.div>
      )}

      <Button
        onClick={handleDecode}
        disabled={!selectedFile || isProcessing}
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
            <Unlock className="w-5 h-5 mr-2" />
            Decode Hidden Message
          </>
        )}
      </Button>
    </div>
  );
}
