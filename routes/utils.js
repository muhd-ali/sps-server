const mongodb = require('mongodb');
const MongoClient = mongodb.MongoClient;
const url = 'mongodb://sps_server:cse_5382_uta@ds137703.mlab.com:37703/sp-service';

function connectToDBAndRun(useDB) {
  return new Promise((resolve, reject) => {
    MongoClient.connect(
      url,
      { useNewUrlParser: true },
      (err, db) => {
        if (err) throw err;
        const dbo = db.db('sp-service');
        useDB(dbo)
          .then(response => resolve(response))
          .catch(error => reject(error))
          .finally(() => {
            db.close();
          });
      }
    );
  });
}

module.exports = {
  connectToDBAndRun,
};
