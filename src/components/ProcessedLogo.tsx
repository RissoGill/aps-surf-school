import { useState, useEffect } from 'react';
import { removeBackground, loadImage } from '@/utils/backgroundRemoval';
import apsLogo from '@/assets/aps-logo.png';

interface ProcessedLogoProps {
  className?: string;
  alt?: string;
}

const ProcessedLogo = ({ className = "h-20 w-auto", alt = "APS Surf School" }: ProcessedLogoProps) => {
  const [processedLogoUrl, setProcessedLogoUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const processLogo = async () => {
      try {
        setIsProcessing(true);
        
        // Load the original logo
        const response = await fetch(apsLogo);
        const blob = await response.blob();
        const imageElement = await loadImage(blob);
        
        // Remove background
        const processedBlob = await removeBackground(imageElement);
        const processedUrl = URL.createObjectURL(processedBlob);
        
        setProcessedLogoUrl(processedUrl);
      } catch (error) {
        console.error('Failed to process logo:', error);
        // Fallback to original logo
        setProcessedLogoUrl(apsLogo);
      } finally {
        setIsProcessing(false);
      }
    };

    processLogo();

    // Cleanup function
    return () => {
      if (processedLogoUrl && processedLogoUrl !== apsLogo) {
        URL.revokeObjectURL(processedLogoUrl);
      }
    };
  }, []);

  if (isProcessing) {
    return (
      <div className={`${className} bg-white/10 rounded-full animate-pulse flex items-center justify-center`}>
        <div className="text-xs text-white opacity-50">Processing...</div>
      </div>
    );
  }

  return (
    <img 
      src={processedLogoUrl || apsLogo} 
      alt={alt}
      className={className}
    />
  );
};

export default ProcessedLogo;