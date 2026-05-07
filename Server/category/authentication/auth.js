const express = require('express');
const jwt = require('jsonwebtoken');
const userStore = require('./engines/user_store');

const router = express.Router();
const SECRET = 'bytemorph_secret_key_123';

// SIGNUP
router.post('/signup', async (req, res) => {
    try {
        const { email, password, name } = req.body;

        if (userStore.findUserByEmail(email)) {
            return res.status(400).json({ error: 'User already exists' });
        }

        const newUser = await userStore.createUser(name, email, password);

        const token = jwt.sign({ id: newUser.id, email: newUser.email }, SECRET, { expiresIn: '24h' });
        res.json({ token, user: { name: newUser.name, email: newUser.email } });
    } catch (err) {
        res.status(500).json({ error: 'Server error during signup' });
    }
});

// LOGIN
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = userStore.findUserByEmail(email);

        if (!user || !(await userStore.verifyPassword(password, user.password))) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign({ id: user.id, email: user.email }, SECRET, { expiresIn: '24h' });
        res.json({ token, user: { name: user.name, email: user.email } });
    } catch (err) {
        res.status(500).json({ error: 'Server error during login' });
    }
});

module.exports = router;
