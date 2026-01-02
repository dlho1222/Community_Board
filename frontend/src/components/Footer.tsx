import React from 'react';
import { Container, Box, Typography } from '@mui/material';

const Footer: React.FC = () => {
  return (
    <Box
      component="footer"
      sx={{
        mt: 5,
        p: 3,
        bgcolor: 'background.paper', // Equivalent to bg-light
        textAlign: 'center',
        borderTop: 1,
        borderColor: 'divider',
      }}
    >
      <Container maxWidth="xl">
        <Typography variant="body2" color="text.secondary">
          &copy; {new Date().getFullYear()} Community Board. All Rights Reserved.
        </Typography>
      </Container>
    </Box>
  );
};

export default Footer;
