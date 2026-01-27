import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Eye, EyeOff, Github, Info, Image, Film } from 'lucide-react';
import { ModeToggle } from '@/components/ModeToggle';
import { EncodePanel } from '@/components/EncodePanel';
import { DecodePanel } from '@/components/DecodePanel';
import { VideoEncodePanel } from '@/components/VideoEncodePanel';
import { VideoDecodePanel } from '@/components/VideoDecodePanel';
import { MediaTypeToggle, MediaType } from '@/components/MediaTypeToggle';
import { HeroBackground } from '@/components/HeroBackground';

type Mode = 'encode' | 'decode';

const Index = () => {
  const [mode, setMode] = useState<Mode>('encode');
  const [mediaType, setMediaType] = useState<MediaType>('image');

  return (
    <div className="min-h-screen relative">
      <HeroBackground />
      
      <div className="container max-w-2xl mx-auto px-4 py-12">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <motion.div
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-card border border-border mb-6 glow-primary"
            animate={{ y: [0, -5, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          >
            <Shield className="w-8 h-8 text-primary" />
          </motion.div>
          
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="text-gradient">Stego</span>
            <span className="text-foreground">Vault</span>
          </h1>
          
          <p className="text-lg text-muted-foreground max-w-md mx-auto">
            Hide secret messages within images and videos using advanced LSB steganography. 
            Your data stays private—no servers, no traces.
          </p>
        </motion.header>

        {/* Main Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card-gradient rounded-2xl border border-border shadow-card p-6 md:p-8"
        >
          {/* Media Type Toggle */}
          <MediaTypeToggle mediaType={mediaType} onMediaTypeChange={setMediaType} />

          {/* Mode Toggle */}
          <div className="mb-8">
            <ModeToggle mode={mode} onModeChange={setMode} />
          </div>

          {/* Panel Content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={`${mediaType}-${mode}`}
              initial={{ opacity: 0, x: mode === 'encode' ? -20 : 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: mode === 'encode' ? 20 : -20 }}
              transition={{ duration: 0.2 }}
            >
              {mediaType === 'image' ? (
                mode === 'encode' ? <EncodePanel /> : <DecodePanel />
              ) : (
                mode === 'encode' ? <VideoEncodePanel /> : <VideoDecodePanel />
              )}
            </motion.div>
          </AnimatePresence>
        </motion.div>

        {/* Info Section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-8 grid gap-4 md:grid-cols-3"
        >
          {[
            {
              icon: Eye,
              title: 'Invisible',
              description: 'Changes are imperceptible to the human eye',
            },
            {
              icon: EyeOff,
              title: 'Client-Side',
              description: 'Everything runs locally in your browser',
            },
            {
              icon: Shield,
              title: 'Secure',
              description: 'PNG output ensures lossless encoding',
            },
          ].map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + index * 0.1 }}
              className="p-4 rounded-xl bg-card/50 border border-border/50 text-center"
            >
              <feature.icon className="w-5 h-5 text-primary mx-auto mb-2" />
              <h3 className="font-medium text-sm text-foreground mb-1">
                {feature.title}
              </h3>
              <p className="text-xs text-muted-foreground">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </motion.div>

        {/* How It Works */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-12 p-6 rounded-xl bg-card/30 border border-border/50"
        >
          <div className="flex items-center gap-2 mb-4">
            <Info className="w-4 h-4 text-primary" />
            <h2 className="font-semibold text-foreground">How It Works</h2>
          </div>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Image className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
              <p className="text-sm text-muted-foreground leading-relaxed">
                <span className="text-foreground font-medium">Image Steganography:</span>{' '}
                Uses <span className="text-primary font-medium">LSB (Least Significant Bit)</span> technique 
                to embed text into pixel RGB values. The output is a lossless PNG to preserve data integrity.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <Film className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
              <p className="text-sm text-muted-foreground leading-relaxed">
                <span className="text-foreground font-medium">Video Steganography:</span>{' '}
                Extracts video frames and applies LSB encoding to the first frame. 
                Outputs as PNG to prevent compression from destroying hidden data.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Footer */}
        <motion.footer
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="mt-12 text-center text-sm text-muted-foreground"
        >
          <p>
            Built with modern steganography techniques. 
            <a 
              href="#" 
              className="text-primary hover:underline ml-1 inline-flex items-center gap-1"
            >
              <Github className="w-3 h-3" />
              Open Source
            </a>
          </p>
        </motion.footer>
      </div>
    </div>
  );
};

export default Index;
