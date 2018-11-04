const dbManager = require('./DBManager').dbManager;

class GroupsManager {
  constructor(user) {
    this.user = user;
  }

  add(name, users) {
    return dbManager.connectToDBAndRun((dbo) => new Promise((resolve, reject) => {
      const groups = dbo.collection('groups');
      const key = this.user.publicInfo.email_address;
      const group = {
        'owner': key,
        'users': [
          ...users,
          key,
        ],
        'name': name,
        'createDate': new Date(),
      };
      groups.insertOne(group, (err, res) => {
        if (err) throw err;
        resolve();
      });
    }));
  }
}

exports.createFromUser = function (user) {
  return new GroupsManager(user);
};
