import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Unlock, Copy, AlertCircle, CheckCircle2, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { VideoDropzone } from './VideoDropzone';
import { ImageDropzone } from './ImageDropzone';
import {
  extractFrames,
  decodeTextFromFrames,
  getVideoThumbnail,
  VideoFrame,
} from '@/lib/videoSteganography';
import { loadImage, decodeText } from '@/lib/steganography';

type InputMode = 'video' | 'frame';

export function VideoDecodePanel() {
  const [inputMode, setInputMode] = useState<InputMode>('frame');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [decodedText, setDecodedText] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');
  const [frames, setFrames] = useState<VideoFrame[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleVideoSelect = useCallback(async (file: File) => {
    setSelectedFile(file);
    setDecodedText(null);
    setError(null);
    setIsProcessing(true);
    setProgress(0);
    setProgressMessage('Loading video...');

    try {
      const thumbnail = await getVideoThumbnail(file);
      setPreview(thumbnail);
      
      setProgressMessage('Extracting frames...');
      
      const { frames: extractedFrames } = await extractFrames(
        file,
        10, // Only need first few frames for decoding
        (p) => setProgress(p)
      );
      
      setFrames(extractedFrames);
      setProgress(100);
      setProgressMessage('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process video');
      setPreview(null);
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const handleImageSelect = useCallback((file: File) => {
    setSelectedFile(file);
    setDecodedText(null);
    setError(null);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleClear = useCallback(() => {
    setSelectedFile(null);
    setPreview(null);
    setDecodedText(null);
    setFrames([]);
    setError(null);
    setProgress(0);
  }, []);

  const handleDecode = useCallback(async () => {
    if (!selectedFile) return;

    setIsProcessing(true);
    setError(null);
    setDecodedText(null);

    try {
      if (inputMode === 'video' && frames.length > 0) {
        const text = decodeTextFromFrames(frames);
        setDecodedText(text);
      } else if (inputMode === 'frame') {
        // Decode from image/frame file
        const { imageData } = await loadImage(selectedFile);
        const text = decodeText(imageData);
        setDecodedText(text);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Decoding failed');
    } finally {
      setIsProcessing(false);
    }
  }, [selectedFile, frames, inputMode]);

  const handleCopy = useCallback(async () => {
    if (!decodedText) return;
    
    await navigator.clipboard.writeText(decodedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [decodedText]);

  return (
    <div className="space-y-6">
      {/* Input Mode Toggle */}
      <div className="flex gap-2">
        <Button
          variant={inputMode === 'frame' ? 'default' : 'outline'}
          size="sm"
          onClick={() => {
            setInputMode('frame');
            handleClear();
          }}
          className="flex-1"
        >
          Encoded Frame (PNG)
        </Button>
        <Button
          variant={inputMode === 'video' ? 'default' : 'outline'}
          size="sm"
          onClick={() => {
            setInputMode('video');
            handleClear();
          }}
          className="flex-1"
        >
          Original Video
        </Button>
      </div>

      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-start gap-2 p-3 rounded-lg bg-muted/30 border border-border"
      >
        <Info className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
        <p className="text-xs text-muted-foreground">
          {inputMode === 'frame' 
            ? 'Upload the encoded PNG frame that was downloaded after encoding.'
            : 'Upload the original video file. Note: Only works if the video wasn\'t re-compressed.'
          }
        </p>
      </motion.div>

      {inputMode === 'video' ? (
        <VideoDropzone
          onVideoSelect={handleVideoSelect}
          selectedVideo={preview}
          onClear={handleClear}
          disabled={isProcessing}
        />
      ) : (
        <ImageDropzone
          onImageSelect={handleImageSelect}
          selectedImage={preview}
          onClear={handleClear}
        />
      )}

      {isProcessing && progressMessage && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{progressMessage}</span>
            <span className="text-primary font-mono">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      )}

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
        disabled={!selectedFile || isProcessing || (inputMode === 'video' && frames.length === 0)}
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
