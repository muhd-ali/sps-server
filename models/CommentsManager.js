const dbManager = require('./DBManager').dbManager;

class CommentsManager {
  constructor(fileID) {
    this.fileID = fileID;
  }

  getList() {
    return dbManager.connectToDBAndRun((dbo) => new Promise((resolve, reject) => {
      const comments = dbo.collection('comments');
      comments.find({
        'fileID': this.fileID,
      }).toArray((err, result) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(result);
      });
    }));
  }

  add(text, user) {
    return dbManager.connectToDBAndRun((dbo) => new Promise((resolve, reject) => {
      const comments = dbo.collection('comments');
      const comment = {
        'fileID': this.fileID,
        'user': {
          'name': user.publicInfo.name,
        },
        'text': text,
        'createDate': new Date(), 
      };
      comments.insertOne(comment, (err, res) => {
        if (err) throw err;
        resolve();
      });
    }));
  }
}

exports.createFrom = function (fileID) {
  return new CommentsManager(fileID)
};
