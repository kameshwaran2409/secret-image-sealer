import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Lock, Download, AlertCircle, CheckCircle2, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { VideoDropzone } from './VideoDropzone';
import {
  extractFrames,
  calculateVideoCapacity,
  encodeTextInFrames,
  framesToVideoBlob,
  downloadVideoBlob,
  getVideoThumbnail,
  VideoFrame,
  VideoMetadata,
} from '@/lib/videoSteganography';

export function VideoEncodePanel() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [videoThumbnail, setVideoThumbnail] = useState<string | null>(null);
  const [secretText, setSecretText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');
  const [capacity, setCapacity] = useState<number | null>(null);
  const [metadata, setMetadata] = useState<VideoMetadata | null>(null);
  const [frames, setFrames] = useState<VideoFrame[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleVideoSelect = useCallback(async (file: File) => {
    setSelectedFile(file);
    setError(null);
    setSuccess(false);
    setIsProcessing(true);
    setProgress(0);
    setProgressMessage('Loading video...');

    try {
      // Get thumbnail
      const thumbnail = await getVideoThumbnail(file);
      setVideoThumbnail(thumbnail);
      
      setProgressMessage('Extracting frames...');
      
      // Extract frames
      const { frames: extractedFrames, metadata: videoMetadata } = await extractFrames(
        file,
        30,
        (p) => setProgress(p)
      );
      
      setFrames(extractedFrames);
      setMetadata(videoMetadata);
      setCapacity(calculateVideoCapacity(extractedFrames));
      setProgress(100);
      setProgressMessage('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process video');
      setVideoThumbnail(null);
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const handleClearVideo = useCallback(() => {
    setSelectedFile(null);
    setVideoThumbnail(null);
    setCapacity(null);
    setMetadata(null);
    setFrames([]);
    setError(null);
    setSuccess(false);
    setProgress(0);
  }, []);

  const handleEncode = useCallback(async () => {
    if (!selectedFile || !secretText.trim() || frames.length === 0) return;

    setIsProcessing(true);
    setError(null);
    setSuccess(false);
    setProgress(0);
    setProgressMessage('Encoding message...');

    try {
      const encodedFrames = encodeTextInFrames(
        frames,
        secretText,
        (p) => setProgress(p * 0.8)
      );
      
      setProgressMessage('Creating output file...');
      
      const blob = await framesToVideoBlob(
        encodedFrames,
        metadata?.fps || 30,
        (p) => setProgress(80 + p * 0.2)
      );
      
      const originalName = selectedFile.name.replace(/\.[^/.]+$/, '');
      // Output as PNG to preserve hidden data (video compression destroys LSB data)
      downloadVideoBlob(blob, `${originalName}_encoded_frame.png`);
      
      setSuccess(true);
      setProgress(100);
      setProgressMessage('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Encoding failed');
    } finally {
      setIsProcessing(false);
    }
  }, [selectedFile, secretText, frames, metadata]);

  const textLength = secretText.length;
  const isOverCapacity = capacity !== null && textLength > capacity;
  const canEncode = selectedFile && secretText.trim() && !isOverCapacity && frames.length > 0;

  return (
    <div className="space-y-6">
      <VideoDropzone
        onVideoSelect={handleVideoSelect}
        selectedVideo={videoThumbnail}
        onClear={handleClearVideo}
        disabled={isProcessing}
      />

      {isProcessing && progressMessage && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{progressMessage}</span>
            <span className="text-primary font-mono">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      )}

      {metadata && !isProcessing && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start gap-2 p-3 rounded-lg bg-muted/30 border border-border"
        >
          <Info className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
          <div className="text-xs text-muted-foreground space-y-1">
            <p>
              <span className="text-foreground font-medium">Video:</span>{' '}
              {metadata.width}x{metadata.height}, {metadata.duration.toFixed(1)}s, {metadata.frameCount} frames
            </p>
            <p className="text-primary/80">
              Note: Output is a PNG frame to preserve hidden data (video compression destroys steganographic data).
            </p>
          </div>
        </motion.div>
      )}

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
          disabled={isProcessing}
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
