const express = require('express');
const router = express.Router();
const user = require('../../models/User');
const fileManager = require('../../models/FileManager');

router.post('/upload/token=:token', (req, res) => {
  const token = req.params.token;
  user.createFromToken(token)
    .then(user => {
      console.log('created user');
      const fm = fileManager.createFromUser(user);
      fm.save(req.files)
        .then(() => {
          res.send(202);
        });
    })
    .catch(() => {
      res.sendStatus(401);
    });
});

module.exports = router;
