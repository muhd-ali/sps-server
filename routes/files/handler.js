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

router.get('/download/id=:fileID/token=:token', (req, res) => {
  const token = req.params.token;
  const fileID = req.params.fileID;
  user.createFromToken(token)
    .then(user => {
      const fm = fileManager.createFromUser(user);
      fm.download(fileID, res);
    })
    .catch(() => {
      res.sendStatus(401);
    });
});

router.get('/delete/id=:fileID/token=:token', (req, res) => {
  const token = req.params.token;
  const fileID = req.params.fileID;
  user.createFromToken(token)
    .then(user => {
      const fm = fileManager.createFromUser(user);
      fm.delete(fileID).then(() => {
        res.sendStatus(200);
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
      const fm = fileManager.createFromUser(user);
      fm.getList()
        .then(list => {
          res.send(list);
        })
        .catch(() => {
          res.sendStatus(400);
        });
    })
    .catch(() => {
      res.sendStatus(401);
    });
});

module.exports = router;
