const dbManager = require('./DBManager').dbManager;
const GridFsStorage = require('multer-gridfs-storage');
const multer = require('multer');


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
}

exports.createFromUser = function (user) {
  return new FileManager(user);
};
