const express = require('express');
const router = express.Router();
const user = require('../../models/User');
const groupsManager = require('../../models/GroupsManager');

router.post('/add/token=:token', (req, res) => {
  const token = req.params.token;
  console.log('here');
  user.createFromToken(token)
    .then(user => {
      const gm = groupsManager.createFromUser(user);
      const data = req.body;
      const name = data.name;
      const users = data.users;
      gm.add(name, users)
        .then(() => {
          res.sendStatus(201);
        });
    })
    .catch(() => {
      res.sendStatus(401);
    });
});

module.exports = router;
