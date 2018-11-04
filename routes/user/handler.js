const express = require('express');
const router = express.Router();
const user = require('../../models/User');

router.get('/info/token=:token', (req, res) => {
  const token = req.params.token;
  user.createFromToken(token)
    .then(user => {
      res.send(user.publicInfo);
    })
    .catch(() => {
      res.sendStatus(401);
    });
});

router.get('/all/token=:token', (req, res) => {
  const token = req.params.token;
  user.createFromToken(token)
    .then(user => {
      user.getList()
        .then(list => {
          res.send(list);
        });
    })
    .catch(err => {
      res.sendStatus(401);
    });
});

router.post('/update/token=:token', (req, res) => {
  const token = req.params.token;
  const data = req.body;
  user.createFromToken(token)
    .then(user => {
      user.updateData(data)
        .then(() => {
          res.sendStatus(200);
        });
    });
});
module.exports = router;
