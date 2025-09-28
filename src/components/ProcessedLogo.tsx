import { useState, useEffect } from 'react';
import { removeBackground, loadImage } from '@/utils/backgroundRemoval';
import apsLogo from '@/assets/aps-logo.png';

interface ProcessedLogoProps {
  alt?: string;
  // Image element classes
  className?: string;
  // Optional wrapper classes (useful for sizing like h-20 w-20)
  containerClassName?: string;
  // Use ML background removal (disabled by default to avoid heavy downloads)
  process?: boolean;
  // Render inside a circular mask
  rounded?: boolean;
}

const ProcessedLogo = ({
  alt = 'APS Surf School',
  className = 'h-full w-full object-contain',
  containerClassName = 'h-20 w-20',
  process = false,
  rounded = true,
}: ProcessedLogoProps) => {
  const [logoUrl, setLogoUrl] = useState<string>(apsLogo);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    let revokedUrl: string | null = null;

    const run = async () => {
      if (!process) {
        setLogoUrl(apsLogo);
        return;
      }
      try {
        setIsProcessing(true);
        const response = await fetch(apsLogo);
        const blob = await response.blob();
        const imageElement = await loadImage(blob);
        const processedBlob = await removeBackground(imageElement);
        const url = URL.createObjectURL(processedBlob);
        revokedUrl = url;
        setLogoUrl(url);
      } catch (err) {
        console.error('Failed to process logo:', err);
        setLogoUrl(apsLogo);
      } finally {
        setIsProcessing(false);
      }
    };

    run();

    return () => {
      if (revokedUrl) URL.revokeObjectURL(revokedUrl);
    };
  }, [process]);

  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <div className={`${containerClassName} ${rounded ? 'rounded-full overflow-hidden' : ''}`}>
      {children}
    </div>
  );

  if (isProcessing) {
    return (
      <Wrapper>
        <div className="h-full w-full bg-white/10 animate-pulse flex items-center justify-center">
          <div className="text-[10px] text-white/70">Processing…</div>
        </div>
      </Wrapper>
    );
  }

  return (
    <Wrapper>
      <img src={logoUrl} alt={alt} className={className} />
    </Wrapper>
  );
};

export default ProcessedLogo;
