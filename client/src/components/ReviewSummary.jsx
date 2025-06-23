import React from 'react';
import {
  Box,
  Typography,
  Rating,
  LinearProgress,
  Grid,
  Chip,
  Stack
} from '@mui/material';
import { styled } from '@mui/material/styles';

const StyledLinearProgress = styled(LinearProgress)(({ theme }) => ({
  height: 8,
  borderRadius: 4,
  backgroundColor: theme.palette.grey[200],
  '& .MuiLinearProgress-bar': {
    borderRadius: 4,
    backgroundColor: '#FFB400',
  },
}));

const ReviewSummary = ({ 
  averageRating = 0, 
  totalReviews = 0, 
  ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } 
}) => {
  const getPercentage = (count) => {
    return totalReviews > 0 ? (count / totalReviews) * 100 : 0;
  };

  const formatRating = (rating) => {
    return rating % 1 === 0 ? rating.toString() : rating.toFixed(1);
  };

  return (
    <Box sx={{ p: 3, bgcolor: 'background.paper', borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
      <Typography variant="h6" gutterBottom fontWeight="bold">
        Đánh giá sản phẩm
      </Typography>
      
      <Grid container spacing={3}>
        {/* Overall Rating */}
        <Grid item xs={12} md={4}>
          <Box textAlign="center">
            <Typography variant="h2" fontWeight="bold" color="primary">
              {formatRating(averageRating)}
            </Typography>
            <Rating 
              value={averageRating} 
              precision={0.1} 
              readOnly 
              size="large"
              sx={{ mb: 1 }}
            />
            <Typography variant="body2" color="text.secondary">
              Dựa trên {totalReviews} đánh giá
            </Typography>
          </Box>
        </Grid>

        {/* Rating Distribution */}
        <Grid item xs={12} md={8}>
          <Stack spacing={1}>
            {[5, 4, 3, 2, 1].map((star) => (
              <Box key={star} display="flex" alignItems="center" gap={2}>
                <Box display="flex" alignItems="center" minWidth={60}>
                  <Typography variant="body2">{star}</Typography>
                  <Typography variant="body2" sx={{ mx: 0.5 }}>⭐</Typography>
                </Box>
                
                <Box flex={1} mr={2}>
                  <StyledLinearProgress
                    variant="determinate"
                    value={getPercentage(ratingDistribution[star] || 0)}
                  />
                </Box>
                
                <Typography variant="body2" color="text.secondary" minWidth={40}>
                  {ratingDistribution[star] || 0}
                </Typography>
              </Box>
            ))}
          </Stack>
        </Grid>
      </Grid>

      {/* Rating Tags */}
      {totalReviews > 0 && (
        <Box mt={3}>
          <Stack direction="row" spacing={1} flexWrap="wrap">
            {averageRating >= 4.5 && (
              <Chip 
                label="Tuyệt vời" 
                color="success" 
                variant="outlined" 
                size="small" 
              />
            )}
            {averageRating >= 4 && averageRating < 4.5 && (
              <Chip 
                label="Rất tốt" 
                color="primary" 
                variant="outlined" 
                size="small" 
              />
            )}
            {averageRating >= 3 && averageRating < 4 && (
              <Chip 
                label="Tốt" 
                color="info" 
                variant="outlined" 
                size="small" 
              />
            )}
            {totalReviews >= 100 && (
              <Chip 
                label="Được nhiều người tin tưởng" 
                color="warning" 
                variant="outlined" 
                size="small" 
              />
            )}
          </Stack>
        </Box>
      )}
    </Box>
  );
};

export default ReviewSummary; 