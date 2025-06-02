import React from 'react';
import { CircularProgress, Box } from '@mui/material';

const Loader = ({ size = 40, color = 'primary', thickness = 4 }) => {
  return (
    <Box 
      display="flex" 
      justifyContent="center" 
      alignItems="center"
    >
      <CircularProgress 
        size={size} 
        color={color} 
        thickness={thickness}
      />
    </Box>
  );
};

export default Loader;
