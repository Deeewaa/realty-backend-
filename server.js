import express from 'express';
import cors from 'cors';

const app = express();

// Middleware
app.use(cors({ origin: 'https://realtyestate.kesug.com' }));
app.use(express.json());

// Routes
app.post('/api/auth/login', (req, res) => {
  res.json({
    success: true,
    user: {
      id: 1,
      name: "Test User",
      email: req.body.email
    }
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
