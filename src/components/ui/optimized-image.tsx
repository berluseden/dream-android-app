import { useState, ImgHTMLAttributes } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

/**
 * Componente de imagen optimizado con:
 * - Lazy loading nativo
 * - Placeholder mientras carga
 * - Fallback si falla
 * - Aspect ratio preservado
 */
interface OptimizedImageProps extends ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  aspectRatio?: 'square' | 'video' | 'portrait' | 'wide';
  fallbackSrc?: string;
  showPlaceholder?: boolean;
}

const aspectRatioClasses = {
  square: 'aspect-square',
  video: 'aspect-video',
  portrait: 'aspect-[3/4]',
  wide: 'aspect-[21/9]',
};

export function OptimizedImage({
  src,
  alt,
  aspectRatio,
  fallbackSrc = '/icons/icon-192x192.png',
  showPlaceholder = true,
  className,
  ...props
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const handleLoad = () => {
    setIsLoading(false);
  };

  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  return (
    <div className={cn('relative overflow-hidden', aspectRatio && aspectRatioClasses[aspectRatio])}>
      {isLoading && showPlaceholder && (
        <Skeleton className="absolute inset-0" />
      )}
      
      <img
        src={hasError ? fallbackSrc : src}
        alt={alt}
        loading="lazy"
        decoding="async"
        onLoad={handleLoad}
        onError={handleError}
        className={cn(
          'object-cover w-full h-full transition-opacity duration-300',
          isLoading ? 'opacity-0' : 'opacity-100',
          className
        )}
        {...props}
      />
    </div>
  );
}

/**
 * Avatar optimizado con placeholder circular
 */
interface OptimizedAvatarProps {
  src?: string;
  alt: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  fallback?: string;
}

const avatarSizes = {
  sm: 'h-8 w-8',
  md: 'h-12 w-12',
  lg: 'h-16 w-16',
  xl: 'h-24 w-24',
};

export function OptimizedAvatar({ 
  src, 
  alt, 
  size = 'md',
  fallback 
}: OptimizedAvatarProps) {
  const [isLoading, setIsLoading] = useState(!!src);
  const [hasError, setHasError] = useState(!src);

  // Generar iniciales del nombre como fallback
  const initials = alt
    .split(' ')
    .map(word => word[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  if (!src || hasError) {
    return (
      <div
        className={cn(
          'rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold',
          avatarSizes[size]
        )}
      >
        {fallback || initials}
      </div>
    );
  }

  return (
    <div className={cn('relative rounded-full overflow-hidden', avatarSizes[size])}>
      {isLoading && <Skeleton className="absolute inset-0 rounded-full" />}
      
      <img
        src={src}
        alt={alt}
        loading="lazy"
        decoding="async"
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setIsLoading(false);
          setHasError(true);
        }}
        className={cn(
          'object-cover w-full h-full transition-opacity duration-300',
          isLoading ? 'opacity-0' : 'opacity-100'
        )}
      />
    </div>
  );
}
