const express = require('express');
const router = express.Router();
const user = require('../../models/User');
const commentsManager = require('../../models/CommentsManager');


router.get('/file=:fileID/token=:token', (req, res) => {
  const token = req.params.token;
  const fileID = req.params.fileID;
  user.createFromToken(token)
    .then(user => {
      const cm = commentsManager.createFrom(fileID)
      cm.getList().then(list => {
        res.send(list);
      });
    })
    .catch(() => {
      res.sendStatus(401);
    });
});

module.exports = router;
