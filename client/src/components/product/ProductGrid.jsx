import React from 'react';
import { Grid, Box, Typography, CircularProgress, Container } from '@mui/material';
import ProductCardNew from './ProductCardNew';

// Component hiển thị lưới sản phẩm
const ProductGrid = ({ products, loading, onProductClick }) => {
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (products.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 5 }}>
        <Typography variant="h6">Không tìm thấy sản phẩm nào</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', py: 2 }}>
      <Grid container spacing={3}>
        {products.map((product) => (
          <Grid item xs={12} sm={6} md={4} key={product._id} sx={{ display: 'flex' }}>
            <Box sx={{ width: '100%', height: '100%' }}>
              <ProductCardNew 
                product={product} 
                onClick={() => onProductClick && onProductClick(product._id)}
              />
            </Box>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default ProductGrid;
