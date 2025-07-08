import React from 'react';
import { cn } from '@/lib/utils';

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
  loading?: 'lazy' | 'eager';
  onLoad?: () => void;
  onError?: () => void;
}

export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  className,
  sizes = '100vw',
  priority = false,
  loading = 'lazy',
  onLoad,
  onError,
}) => {
  // Extract base name without extension
  const baseName = src.replace(/\.[^/.]+$/, '');
  const isOptimized = src.includes('optimized');
  
  // If already using optimized images, return as is
  if (isOptimized) {
    return (
      <img
        src={src}
        alt={alt}
        className={cn('w-full h-auto', className)}
        sizes={sizes}
        loading={priority ? 'eager' : loading}
        onLoad={onLoad}
        onError={onError}
      />
    );
  }

  // Generate optimized image paths
  const optimizedSrc = src.replace('/images/', '/images/optimized/').replace(/\.[^/.]+$/, '-webp.webp');
  const mobileSrc = src.replace('/images/', '/images/optimized/').replace(/\.[^/.]+$/, '-webp-mobile.webp');
  const fallbackSrc = src; // Original image as fallback

  return (
    <picture>
      {/* Mobile optimized version */}
      <source
        media="(max-width: 768px)"
        srcSet={mobileSrc}
        type="image/webp"
      />
      {/* Desktop optimized version */}
      <source
        media="(min-width: 769px)"
        srcSet={optimizedSrc}
        type="image/webp"
      />
      {/* Fallback for older browsers */}
      <img
        src={fallbackSrc}
        alt={alt}
        className={cn('w-full h-auto', className)}
        sizes={sizes}
        loading={priority ? 'eager' : loading}
        onLoad={onLoad}
        onError={onError}
      />
    </picture>
  );
};

export default OptimizedImage; 