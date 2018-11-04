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
      const files = data.files;
      gm.add(name, users, files)
        .then(() => {
          res.sendStatus(201);
        });
    })
    .catch(() => {
      res.sendStatus(401);
    });
});

router.get('/all/token=:token', (req, res) => {
  const token = req.params.token;
  user.createFromToken(token)
    .then(user => {
      const gm = groupsManager.createFromUser(user);
      gm.getList()
        .then(list => {
          res.send(list);
        });
    })
    .catch(err => {
      res.sendStatus(401);
    });
});

router.get('/delete/id=:groupID/token=:token', (req, res) => {
  const token = req.params.token;
  const groupID = req.params.groupID;
  user.createFromToken(token)
    .then(user => {
      const gm = groupsManager.createFromUser(user);
      gm.delete(groupID).then(() => {
        res.sendStatus(200);
      });
    })
    .catch(() => {
      res.sendStatus(401);
    });
});

module.exports = router;
