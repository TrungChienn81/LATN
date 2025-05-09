import React from 'react';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';

const AdminOverview = () => {
  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          Tổng quan Dashboard
        </Typography>
      </Box>
      
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper 
            elevation={1} 
            sx={{ 
              p: 3, 
              width: '100%', 
              borderRadius: '8px',
              backgroundColor: '#f9f9f9'
            }}
          >
            <Typography paragraph>
              Chào mừng bạn đến với khu vực quản trị. Tại đây bạn có thể xem các số liệu thống kê nhanh (sẽ được phát triển trong tương lai).
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AdminOverview; 