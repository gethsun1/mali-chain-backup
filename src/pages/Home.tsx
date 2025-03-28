import { Card, CardContent, Typography, Paper, Button, Box } from "@mui/material";
import { Stack } from "@mui/system";
import { motion } from "framer-motion";

export default function Home() {
  // Sample data for info cards describing MaliChain's value proposition
  const cardData = [
    {
      title: "Fractional Ownership",
      description: "Tokenize high-value properties to allow investments starting as low as KES 220, unlocking liquidity and democratizing access.",
      icon: "🏠" // You can replace with a custom icon later
    },
    {
      title: "Transparent Transactions",
      description: "Every transaction is recorded on Hedera’s secure ledger for full transparency and trust.",
      icon: "🔒"
    },
    {
      title: "Inclusive Investment",
      description: "Empower local investors by bridging traditional real estate with cutting‑edge blockchain technology.",
      icon: "💡"
    }
  ];

  return (
    <Paper 
      elevation={0}
      sx={{
        minHeight: '80vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        color: 'white',
        backgroundColor: 'transparent', // keeps the parallax background visible
        position: 'relative',
        zIndex: 2,
        p: 2,
      }}
    >
      {/* Hero Text with Entrance Animation */}
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1 }}
      >
        <Typography variant="h3" gutterBottom sx={{ fontWeight: 700, letterSpacing: 2 }}>
          Welcome to MaliChain
        </Typography>
      </motion.div>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 0.5 }}
      >
        <Typography variant="h6" sx={{ mb: 4, color: 'gray' }}>
          Transforming Real Estate Investment with Blockchain
        </Typography>
      </motion.div>
      
      {/* Info Cards Carousel / Stack */}
      <Box sx={{ width: '100%', maxWidth: 800 }}>
        <Stack spacing={3}>
          {cardData.map((card, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: index * 0.3 + 1 }}
            >
              <Card sx={{ backgroundColor: '#111', borderRadius: 2 }}>
                <CardContent>
                  <Typography variant="h5" sx={{ mb: 1, color: '#FF3B30' }}>
                    {card.icon} {card.title}
                  </Typography>
                  <Typography variant="body1" sx={{ color: 'white' }}>
                    {card.description}
                  </Typography>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </Stack>
      </Box>
      
      {/* Call-to-action button */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 2 }}
      >
        <Button variant="outlined" size="large" sx={{ borderColor: '#FF3B30', color: '#FF3B30', mt: 4 }}>
          Explore More
        </Button>
      </motion.div>
    </Paper>
  );
}
