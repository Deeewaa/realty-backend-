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

// Registration endpoint
app.post("/api/auth/register", (req, res) => {
  try {
    // Example registration logic (replace with real code)
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