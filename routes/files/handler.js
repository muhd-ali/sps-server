const express = require('express');
const router = express.Router();
const user = require('../../models/User');
const fileManager = require('../../models/FileManager');

router.post('/upload/token=:token', (req, res) => {
  const token = req.params.token;
  user.createFromToken(token)
    .then(user => {
      const fm = fileManager.createFromUser(user);
      fm.save(req, res);
    })
    .catch(() => {
      res.sendStatus(401);
    });
});

module.exports = router;
