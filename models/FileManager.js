const dbManager = require('./DBManager').dbManager;
const GridFsStorage = require('multer-gridfs-storage');
const multer = require('multer');
const MongoGridFS = require('mongo-gridfs').MongoGridFS;
const mongoose = require('mongoose');
const groupsManager = require('./GroupsManager');
const ObjectId = require('mongodb').ObjectID;

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

  delete(fileID) {
    return dbManager.connectAndUseDBObject((dbo) => new Promise((resolve) => {
      Promise.all([
        dbo.collection('fs.files').deleteMany({
          '_id': ObjectId(fileID),
        }),
        dbo.collection('fs.chunks').deleteMany({
          'files_id': ObjectId(fileID),
        }),
        dbo.collection('comments').deleteMany({
          'fileID': fileID,
        }),
        dbo.collection('groups').update({}, {
          '$pull': {'files': fileID},
        })
      ]).then(() => resolve());
    }));
  }

  getList() {
    return new Promise((resolve, reject) => {
      const gm = groupsManager.createFromUser(this.user);
      gm.getList()
        .then(groups => {
          const concat = (a, b) => a.concat(b);
          const sharedFiles = groups.map(g => g.files.map(id => ObjectId(id))).reduce(concat,[]);
          const email_address = this.user.publicInfo.email_address;
          dbManager.connectAndUseDBObject((dbo) => new Promise((resolve1, reject1) => {
            const files = dbo.collection('fs.files');
            files.find({
              '$or': [
                {'metadata.owner': email_address},
                {'_id': {'$in': sharedFiles}},
              ],
            }).toArray((err, result) => {
              if (err) {
                reject1(err);
                reject(err);
                return;
              }
              resolve1(result);
              resolve(result);
            });
          })).catch(err => reject(err));
        });
    });
  }
}

exports.createFromUser = function (user) {
  return new FileManager(user);
};
