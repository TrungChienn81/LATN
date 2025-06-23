import React, { useState } from 'react';
import { Box } from '@mui/material';

/**
 * Enhanced image component with fallback handling and URL normalization
 */
const ImageWithFallback = (props) => {
  const { 
    src, 
    alt = 'Image', 
    sx = {},
    ...rest 
  } = props;
  
  const [hasError, setHasError] = useState(false);
  
  // Nếu không có ảnh hoặc đã xảy ra lỗi, hiển thị placeholder
  if (!src || hasError) {
    return (
      <Box
        sx={{
          width: sx.width || 100,
          height: sx.height || 100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#f0f0f0',
          color: '#757575',
          fontSize: '12px',
          border: '1px solid #e0e0e0',
          borderRadius: sx.borderRadius || 0,
          ...sx
        }}
        {...rest}
      >
        No Image
      </Box>
    );
  }

  // Chuẩn bị URL
  let imageSrc = src;
  
  // Xử lý các trường hợp URL
  if (src) {
    try {
      // Handle URLs that might start with // (protocol-relative)
      if (src.startsWith('//')) {
        imageSrc = `https:${src}`;
      } 
      // Handle absolute URLs (http, https, data, blob)
      else if (src.startsWith('http') || src.startsWith('data:') || src.startsWith('blob:')) {
        imageSrc = src;
      }
      // Handle local server uploads (/uploads/...)
      else if (src.startsWith('/uploads/')) {
        const apiBaseUrl = `${window.location.protocol}//${window.location.hostname}:3001`;
        imageSrc = `${apiBaseUrl}${src}`;
      }
      // Handle URLs that might be missing the protocol
      else if (src.includes('cdn.') || src.includes('.com/') || src.includes('.net/') || src.includes('.org/')) {
        imageSrc = src.startsWith('www.') ? `https://${src}` : src;
        if (!imageSrc.startsWith('http')) {
          imageSrc = `https://${imageSrc}`;
        }
      }
      // Handle other relative paths
      else if (!src.match(/^[a-z]+:/i)) {
        const apiBaseUrl = `${window.location.protocol}//${window.location.hostname}:3001`;
        imageSrc = src.startsWith('/') ? `${apiBaseUrl}${src}` : `${apiBaseUrl}/${src}`;
      }
    } catch (error) {
      console.error('Error processing image URL:', error);
      imageSrc = src; // Fallback to original source on error
    }
    
    // Log the image source for debugging
    console.log(`Image source: ${src} → ${imageSrc}`);
  }

  // Render image with error handler
  return (
    <Box 
      sx={{
        position: 'relative', 
        overflow: 'hidden',
        width: sx.width || '100%',
        height: sx.height || '100%',
        ...sx
      }}
    >
      <img
        src={imageSrc}
        alt={alt}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          display: 'block',
        }}
        onError={(e) => {
          console.log(`Image failed to load: ${imageSrc}`);
          setHasError(true);
        }}
        {...rest}
      />
    </Box>
  );
};

// Provide both named and default exports
export { ImageWithFallback };
export default ImageWithFallback;
