const express = require('express');
const router = express.Router();
const user = require('./User');

router.get('/token=:token', function(req, res, next) {
  const token = req.params.token;
  user.createUserFromToken(token)
    .then(user => {
      res.send(user);
    });
});

module.exports = router;
