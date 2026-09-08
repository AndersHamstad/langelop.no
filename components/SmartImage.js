import Image from 'next/image';

// Bilder fra disse domenene kjøres gjennom next/image-optimalisering.
// Alt annet (bilder hentet fra eksterne arrangør-sider) vises som vanlig <img>,
// siden vi ikke kan whiteliste hvert nye løps eget bildedomene på forhånd.
const OPTIMIZED_HOSTS = ['aqigjepaomgykibkiklz.supabase.co', 'therunningchannel.com'];

function isOptimizable(src) {
  if (!src) return false;
  if (src.startsWith('/')) return true;
  try {
    return OPTIMIZED_HOSTS.includes(new URL(src).hostname);
  } catch {
    return false;
  }
}

export default function SmartImage({ src, alt, fill, priority, sizes, className, style }) {
  if (isOptimizable(src)) {
    return (
      <Image
        src={src}
        alt={alt}
        fill={fill}
        priority={priority}
        sizes={sizes}
        className={className}
        style={style}
      />
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      loading={priority ? 'eager' : 'lazy'}
      className={fill ? `absolute inset-0 w-full h-full ${className || ''}` : className}
      style={style}
    />
  );
}
