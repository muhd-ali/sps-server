const axios = require('axios');
const mongodb = require('mongodb');
const MongoClient = mongodb.MongoClient;
const url = 'mongodb://sps_server:cse_5382_uta@ds137703.mlab.com:37703/sp-service';

const webAuth = {
  domain: 'https://venom-in-veins.auth0.com',
  clientID: 'ATgqm_2d-H595P0cgfNluRZA-FU3UpAd'
};

class User {
  constructor(token) {
    this.token = token;
    this.authPromise = this.getAuthPromise();
    this.databasePromise = this.getDatabasePromise();
  }

  getAuthPromise() {
    const axiosReq = axios.create({
      baseURL: webAuth.domain,
      headers: {
        'Authorization': 'Bearer ' + this.token,
      }
    });

    return axiosReq.get('/userinfo');
  }

  populateFrom(user, isNewUser) {
    this.user = Object.assign({
      'isNewUser': isNewUser,
    }, user);
  }

  populateNewUserFrom(userData, users) {
    return new Promise((resolve, reject) => {
      const user = {
        'name': userData.name,
        'email_address': userData.email,
        'permissions_type': 'standard',
      };
      users.insertOne(user, (err, res) => {
        if (err) throw err;
        this.populateFrom(user, true);
        resolve();
      });
    });
  }

  populateUserFrom(user) {
    this.populateFrom(user, false);
  }

  getDatabasePromise() {
    const self = this;
    return new Promise((resolve, reject) => {
      this.authPromise.then(authResponse => {
        MongoClient.connect(url, function(err, db) {
          if (err) throw reject(err);
          const dbo = db.db('sp-service');
          const users = dbo.collection('users');
          const userData = authResponse.data;
          users.findOne({
            'email_address': userData.email,
          }, (err, result) => {
            if (result === null) {
              self.populateNewUserFrom(userData, users)
                .then(() => {
                  db.close();
                  resolve();
                });
            } else {
              self.populateUserFrom(result);
              db.close();
              resolve();
            }
          });
        });
      });
    });
  }

  getPromise() {
    return new Promise((resolve, reject) => {
      this.databasePromise
        .then((response) => {
          resolve(this.user);
      });
    });
  }
}

// exports.User = User;
exports.createUserFromToken = function (token) {
  return new User(token).getPromise();
};
