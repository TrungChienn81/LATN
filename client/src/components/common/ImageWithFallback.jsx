import React, { useState } from 'react';

/**
 * Simple image component with fallback
 */
const ImageWithFallback = (props) => {
  const { 
    src, 
    alt = 'Image', 
    sx = {},
    style = {},
    ...rest 
  } = props;
  
  const [hasError, setHasError] = useState(false);
  
  // Debug log
  console.log('ImageWithFallback rendering:', {
    src,
    hasError,
    alt
  });
  
  // Determine the actual src to use
  let imageSrc = src;
  
  // If no src provided or error occurred, use placeholder
  if (!src || hasError) {
    // Use a data URL for a simple gray placeholder
    imageSrc = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjVmNWY1Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzc1NzU3NSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5vIEltYWdlPC90ZXh0Pjwvc3ZnPg==';
  }

  // Force consistent styling to make images display
  const combinedStyle = {
    width: '100%', 
    height: 'auto',
    maxWidth: '100%',
    maxHeight: '100%',
    objectFit: 'contain',
    objectPosition: 'center',
    display: 'block',
    position: 'relative',
    zIndex: 1,
    ...style,
    ...sx
  };

  return (
    <img
      src={imageSrc}
      alt={alt}
      style={combinedStyle}
      onError={(e) => {
        console.error('Image failed to load:', src, e);
        if (!hasError) {
          setHasError(true);
        }
      }}
      onLoad={() => {
        console.log('Image loaded successfully:', src);
      }}
      loading="eager"
      crossOrigin="anonymous"
      referrerPolicy="no-referrer"
      {...rest}
    />
  );
};

// Provide both named and default exports
export { ImageWithFallback };
export default ImageWithFallback;
