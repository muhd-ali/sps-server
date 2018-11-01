const express = require('express');
const router = express.Router();
const userModule = require('./User');

router.get('/info/token=:token', (req, res) => {
  const token = req.params.token;
  userModule.createUserFromToken(token)
    .then(user => {
      res.send(user.info);
    });
});

router.post('/update/token=:token', (req, res) => {
  const token = req.params.token;
  const data = req.body;
  userModule.createUserFromToken(token)
    .then(user => {
      user.updateData(data)
        .then(() => {
          res.sendStatus(200);
        });
    });
});
module.exports = router;
