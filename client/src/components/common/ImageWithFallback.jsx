import React from 'react';
import { Box } from '@mui/material';

/**
 * Simple image component with pure CSS fallback
 */
const ImageWithFallback = (props) => {
  const { 
    src, 
    alt = 'Image', 
    sx = {},
    ...rest 
  } = props;
  
  // Nếu không có ảnh, hiển thị placeholder
  if (!src) {
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
  if (!src.startsWith('http') && !src.startsWith('data:') && !src.startsWith('blob:')) {
    // For relative paths
    const apiBaseUrl = `${window.location.protocol}//${window.location.hostname}:5000`;
    imageSrc = src.startsWith('/') ? `${apiBaseUrl}${src}` : `${apiBaseUrl}/${src}`;
  }

  // Render image with inline error handler
  return (
    <div style={{ position: 'relative', overflow: 'hidden', ...sx }}>
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
          // Pure DOM approach - replace image with div
          const parent = e.target.parentNode;
          if (parent) {
            // Create fallback div
            const fallback = document.createElement('div');
            fallback.style.width = '100%';
            fallback.style.height = '100%';
            fallback.style.display = 'flex';
            fallback.style.alignItems = 'center';
            fallback.style.justifyContent = 'center';
            fallback.style.backgroundColor = '#f0f0f0';
            fallback.style.color = '#757575';
            fallback.style.fontSize = '12px';
            fallback.textContent = 'No Image';
            
            // Replace img with div
            parent.replaceChild(fallback, e.target);
          }
        }}
        {...rest}
      />
    </div>
  );
};

export default ImageWithFallback;
