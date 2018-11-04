const dbManager = require('./DBManager').dbManager;
const GridFsStorage = require('multer-gridfs-storage');
const multer = require('multer');
const MongoGridFS = require('mongo-gridfs').MongoGridFS;
const mongoose = require('mongoose');

class FileManager {
  constructor(user) {
    this.user = user;
    this.setup();
  }

  setup() {
    this.setStorage();
    this.setUpload();
  }

  setStorage() {
    const email_address = this.user.publicInfo.email_address;
    this.storage = GridFsStorage({
      url : dbManager.url,
      file: (req, file) => {
        return {
          'filename': file.originalname,
          'metadata': {
            'owner': email_address,
            'comments': [],
          },
        };
      },
    });
  }

  setUpload() {
    this.upload = multer({
      storage: this.storage
    }).array('files');
  }

  save(req, res) {
    return this.upload(req, res, (err) => {
      if(err){
        res.json({error_code:1,err_desc:err});
        return;
      }
      res.json({error_code:0, error_desc: null, file_uploaded: true});
    });
  }

  download(id, res) {
    mongoose.connect(dbManager.url)
      .then(() => {
        const db = mongoose.connection.db;
        const gfs = new MongoGridFS(db, 'fs');
        gfs.readFileStream(id).then(item => {
          item.pipe(res);
        });
      })
      .catch(err => {
        res.sendStatus(401);
      });
  }

  getList() {
    const email_address = this.user.publicInfo.email_address;
    return dbManager.connectToDBAndRun((dbo) => new Promise((resolve, reject) => {
      const files = dbo.collection('fs.files');
      files.find({
        'metadata.owner': email_address,
      }).toArray((err, result) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(result);
      });
    }));
  }
}

exports.createFromUser = function (user) {
  return new FileManager(user);
};
