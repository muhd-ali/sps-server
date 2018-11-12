const dbManager = require('./DBManager').dbManager;
const ObjectId = require('mongodb').ObjectID;

class GroupsManager {
  constructor(user) {
    this.user = user;
  }

  add(name, users, files) {
    return dbManager.connectAndUseDBObject((dbo) => new Promise((resolve, reject) => {
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
        'isActive': false,
      };
      groups.insertOne(group, (err, res) => {
        if (err) {
          reject(err);
        }
        resolve();
      });
    }));
  }

  getList() {
    const key = this.user.publicInfo.email_address;
    return dbManager.connectAndUseDBObject((dbo) => new Promise((resolve, reject) => {
      const groups = dbo.collection('groups');
      let query = {};
      if (!this.user.isAdmin()) {
        const ifNotOwnerQuery = {
          '$and': [{
            'users': { '$in': [key] },
          }, {
            'isActive': true,
          }]
        };
        query = {
          '$or': [{
            'owner': key,
          },
          ifNotOwnerQuery
          ],
        };
      }
      groups.find(query).toArray((err, result) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(result);
      });
    }));
  }

  delete(groupID) {
    return dbManager.connectAndUseDBObject((dbo) => new Promise((resolve) => {
      const query = {};
      if (!this.user.isAdmin()) {
        query.owner = this.user.publicInfo.email_address;
      }
      Promise.all([
        dbo.collection('groups').deleteMany({
          '_id': ObjectId(groupID),
          ...query,
        }),
      ]).then(() => resolve());
    }));
  }

  updateData(groupID, data) {
    return dbManager.connectAndUseDBObject(dbo => new Promise((resolve, reject) => {
      const groups = dbo.collection('groups');
      groups.updateOne({
        '_id': ObjectId(groupID),
      },
      {
        '$set': data,
      },
      (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    }));
  }

}

exports.createFromUser = function (user) {
  return new GroupsManager(user);
};
