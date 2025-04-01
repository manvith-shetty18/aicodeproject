const express = require('express');
const router = express.Router();
const User = require('../models/User');

router.post('/login', async (req, res) => {
  try {
    const { username, email } = req.body;
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.json({ message: 'Welcome back, login successful!' });
    }

    const newUser = new User({ username, email });
    await newUser.save();
    res.json({ message: 'Login successful, user saved to database' });
  } catch (error) {
    res.status(500).json({ message: 'Error processing login' });
  }
});

module.exports = router;
