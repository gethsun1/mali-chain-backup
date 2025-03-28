import { Box, Typography } from '@mui/material';
import MalichainLogo from "../assets/malichain.png";

export default function Footer() {
  return (
    <Box sx={{ mt: 4, p: 2, textAlign: 'center', backgroundColor: '#111' }}>
      <img 
        src={MalichainLogo}
        alt='MaliChain'
        style={{ height: '30px', marginBottom: '8px' }}
      />
      <Typography variant="body2" color="gray">
        © {new Date().getFullYear()} MaliChain. All rights reserved.
      </Typography>
    </Box>
  );
}
