const express = require('express');
const router = express.Router();
const Url = require('../models/Url');
const { nanoid } = require('nanoid');

// POST /shorten → create a new short URL
router.post('/shorten', async (req, res) => {
  const { originalUrl, expiresAt } = req.body;

  if (!originalUrl) {
    return res.status(400).json({ error: 'originalUrl is required' });
  }

  const shortCode = nanoid(6); // Generates something like "aB3dE9"

  try {
    const url = new Url({
      shortCode,
      originalUrl,
      expiresAt: expiresAt || null
    });

    await url.save();

    res.status(201).json({
      shortCode,
      shortUrl: `${req.protocol}://${req.get('host')}/${shortCode}`
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /:shortCode → redirect to original URL
router.get('/:shortCode', async (req, res) => {
  const { shortCode } = req.params;

  try {
    const url = await Url.findOne({ shortCode });

    if (!url) {
      return res.status(404).json({ error: 'Short URL not found' });
    }

    if (url.expiresAt && url.expiresAt < new Date()) {
      return res.status(410).json({ error: 'Link has expired' });
    }

    res.redirect(url.originalUrl);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
