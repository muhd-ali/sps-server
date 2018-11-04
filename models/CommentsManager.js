const dbManager = require('./DBManager').dbManager;

class CommentsManager {
  constructor(fileID) {
    this.fileID = fileID;
  }

  getList() {
    return dbManager.connectToDBAndRun((dbo) => new Promise((resolve, reject) => {
      const files = dbo.collection('comments');
      files.find({
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
}

exports.createFrom = function (fileID) {
  return new CommentsManager(fileID)
};
