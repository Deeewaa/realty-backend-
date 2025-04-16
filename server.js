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

// 👇 Registration endpoint MUST come BEFORE app.listen()
app.post("/api/auth/register", (req, res) => {
  try {
    const { email, password } = req.body;
    res.json({
      success: true,
      message: "User registered!",
      user: { email }
    });
  } catch (error) {
    res.status(500).json({ error: "Registration failed" });
  }
});

// Start server (LAST IN THE FILE)
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});