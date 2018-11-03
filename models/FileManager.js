const dbManager = require('./DBManager').dbManager;

class FileManager {
  constructor(user) {
    this.user = user;
  }

  save(files) {
    return Promise.all(files.map(file => {
      return new Promise((resolve, reject) => {
        resolve();
      });
    }))
  }
}

exports.createFromUser = function (user) {
  return new FileManager(user);
};
