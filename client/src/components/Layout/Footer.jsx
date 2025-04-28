import React from 'react';
import { Box, Container, Typography, Link } from '@mui/material';

function Footer() {
  return (
    <Box component="footer" sx={{ py: 3, px: 2, mt: 'auto', backgroundColor: (theme) => theme.palette.mode === 'light' ? theme.palette.grey[200] : theme.palette.grey[800], }}>
      <Container maxWidth="lg">
        <Typography variant="body1" align="center">LATN E-commerce Project</Typography>
        <Typography variant="body2" color="text.secondary" align="center">
          {'Bản quyền © '}
          <Link color="inherit" href="#">LATN Team</Link>{' '}
          {new Date().getFullYear()}{'.'}
        </Typography>
      </Container>
    </Box>
  );
}
export default Footer;