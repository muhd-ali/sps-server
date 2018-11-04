const dbManager = require('./DBManager').dbManager;

class GroupsManager {
  constructor(user) {
    this.user = user;
  }

  add(name, users, files) {
    return dbManager.connectToDBAndRun((dbo) => new Promise((resolve, reject) => {
      const groups = dbo.collection('groups');
      const key = this.user.publicInfo.email_address;
      const group = {
        'owner': key,
        'users': [
          ...users,
          key,
        ],
        'files': files,
        'name': name,
        'createDate': new Date(),
      };
      groups.insertOne(group, (err, res) => {
        if (err) throw err;
        resolve();
      });
    }));
  }

  getList() {
    const key = this.user.publicInfo.email_address;
    return dbManager.connectToDBAndRun((dbo) => new Promise((resolve, reject) => {
      const groups = dbo.collection('groups');
      groups.find({
        '$or': [{
          'owner': key,
        },{
          'users': { '$in': [key] }
        },
        ],
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
  return new GroupsManager(user);
};
