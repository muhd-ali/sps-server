const axios = require('axios');
const dbManager = require('./DBManager').dbManager;

const webAuth = {
  domain: 'https://venom-in-veins.auth0.com',
  clientID: 'ATgqm_2d-H595P0cgfNluRZA-FU3UpAd'
};

class User {
  constructor(token) {
    this.token = token;
  }

  authenticateUser() {
    return new Promise((resolve, reject) => {
      const axiosReq = axios.create({
        baseURL: webAuth.domain,
        headers: {
          'Authorization': 'Bearer ' + this.token,
        }
      });
      axiosReq.get('/userinfo')
        .then(response => {
          resolve(response.data);
        })
        .catch(err => {
          reject(err);
        });
    });
  }

  populateFrom(user, isNewUser) {
    this.publicInfo = Object.assign({
      'isNewUser': isNewUser,
    }, user);
  }

  populateNewUserFrom(userData, users) {
    const self = this;
    return new Promise((resolve, reject) => {
      const user = {
        'name': userData.name,
        'email_address': userData.email,
        'permissions_type': 'standard',
      };
      users.insertOne(user, (err, res) => {
        if (err) throw err;
        self.populateFrom(user, true);
        resolve();
      });
    });
  }

  populateUserFrom(user) {
    this.populateFrom(user, false);
  }

  updateData(data) {
    const self = this;
    return dbManager.connectToDBAndRun(dbo => new Promise((resolve, reject) => {
      const users = dbo.collection('users');
      users.updateOne({
        'email_address': self.publicInfo.email_address,
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

  createOrFetchUserFor(userData) {
    const self = this;
    return dbManager.connectToDBAndRun(dbo => new Promise((resolve, reject) => {
      const users = dbo.collection('users');
      users.findOne({
        'email_address': userData.email,
      }, (err, result) => {
        if (err) {
          reject(err);
          return;
        }
        if (result === null) {
          self.populateNewUserFrom(userData, users)
            .then(() => {
              resolve();
            });
        } else {
          self.populateUserFrom(result);
          resolve();
        }
      });
    }));
  }

  getList() {
    const email_address = this.publicInfo.email_address;
    return dbManager.connectToDBAndRun((dbo) => new Promise((resolve, reject) => {
      const users = dbo.collection('users');
      users.find({
        '$and': [
          {'email_address': { '$ne': email_address }},
          {'email_address': { '$ne': '' }},
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

  getPromise() {
    const self = this;
    return new Promise((resolve, reject) => {
      self.authenticateUser()
        .then(userData => {
          self.createOrFetchUserFor(userData)
            .then(() => {
              resolve(self);
            })
            .catch(() => {
              reject();
            });
        })
        .catch(() => {
          reject();
        });
    });
  }
}

// exports.User = User;
exports.createFromToken = function (token) {
  return new User(token).getPromise();
};
