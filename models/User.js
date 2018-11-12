const axios = require('axios');
const dbManager = require('./DBManager').dbManager;
const ACL = require('acl');

const webAuth = {
  domain: 'https://venom-in-veins.auth0.com',
  clientID: 'ATgqm_2d-H595P0cgfNluRZA-FU3UpAd'
};

class User {
  constructor(token) {
    this.token = token;
  }

  isAdmin() {
    return this.publicInfo.roles.indexOf('admin') > -1;
  }

  createAndUseACL(useAcl) {
    return dbManager.connectAndUseDBObject((dbo) => new Promise((resolve, reject) => {
      const acl = new ACL(new ACL.mongodbBackend(dbo, 'acl_'));
      useAcl(acl)
        .then(response => resolve(response))
        .catch(error => reject(error));
    }));
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
    const self = this;
    return this.createAndUseACL((acl) => new Promise((resolve, reject) => {
      acl.userRoles(user.email_address, (err, roles) => {
        if (err) {
          reject(err);
        }
        self.publicInfo = Object.assign({
          'isNewUser': isNewUser,
          'roles': roles,
        }, user);
        resolve();
      });
    }));
  }

  populateNewUserFrom(userData, users) {
    const self = this;
    return new Promise((resolve, reject) => {
      const user = {
        'name': userData.name,
        'email_address': userData.email,
      };
      users.insertOne(user, (err, res) => {
        if (err) {
          reject(err);
        }
        self.createAndUseACL((acl) => new Promise((resolve1) => {
          acl.addUserRoles(userData.email, 'standard', () => resolve1());
        })).then(() => {
          self.populateFrom(user, true)
            .then(() => resolve());
        });
      });
    });
  }

  populateOldUserFrom(user) {
    return this.populateFrom(user, false);
  }

  updateData(data) {
    const self = this;
    return dbManager.connectAndUseDBObject(dbo => new Promise((resolve, reject) => {
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
    return dbManager.connectAndUseDBObject(dbo => new Promise((resolve, reject) => {
      const users = dbo.collection('users');
      users.findOne({
        'email_address': userData.email,
      }, (err, result) => {
        if (err) {
          reject(err);
        }
        if (result === null) {
          self.populateNewUserFrom(userData, users)
            .then(() => {
              resolve();
            });
        } else {
          self.populateOldUserFrom(result)
            .then(() => resolve())
            .catch(err => reject(err));
        }
      });
    }));
  }

  getList() {
    const email_address = this.publicInfo.email_address;
    return dbManager.connectAndUseDBObject((dbo) => new Promise((resolve, reject) => {
      const users = dbo.collection('users');
      users.find({
        '$and': [
          {'email_address': { '$ne': email_address }},
          {'email_address': { '$ne': '' }},
        ],
      }).toArray((err, usersWithoutRoles) => {
        if (err) {
          reject(err);
        }
        this.createAndUseACL((acl) => new Promise((resolve1) => {
          const promises = usersWithoutRoles.map(user => new Promise((resolve2) => {
            acl.userRoles(user.email_address, (err, roles) => {
              if (err) {
                reject(err);
              }
              user.isAdmin = roles.indexOf('admin') > -1 ? true : false;
              resolve2(user);
            });
          }));
          Promise.all(promises).then((usersWithRoles) => {
            resolve1(usersWithRoles);
          });
        }))
          .then((usersWithRoles) => {
            resolve(usersWithRoles);
          });
      });
    }));
  }

  updatePerms(data) {
    let toBeRemoved = 'standard';
    let toBeAdded = 'admin';
    if (!data.isAdmin) {
      toBeRemoved = 'admin';
      toBeAdded = 'standard';
    }
    return this.createAndUseACL((acl) => new Promise((resolve, reject) => {
      Promise.all([
        acl.removeUserRoles(data.email_address, toBeRemoved),
        acl.addUserRoles(data.email_address, toBeAdded),
      ])
        .then(() => resolve())
        .catch((err) => reject(err));
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
            .catch((err) => {
              console.log(err)
              reject();
            });
        })
        .catch((err) => {
          console.log(err);

          reject(err);
        });
    });
  }
}

// exports.User = User;
exports.createFromToken = function (token) {
  return new User(token).getPromise();
};
