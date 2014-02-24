var path = require('path'),
    rootPath = path.normalize(__dirname + '/..'),
    env = process.env.NODE_ENV || 'development';

var config = {
  development: {
    root: rootPath,
    app: {
      name: 'yo'
    },
    port: 3000,
    db: 'mongodb://tosser:Password1!@ds027519.mongolab.com:27519/viewer'
  }

  /*test: {
    root: rootPath,
    app: {
      name: 'yo'
    },
    port: 3000,
    db: 'mongodb://localhost/yo-test'
  },

  production: {
    root: rootPath,
    app: {
      name: 'yo'
    },
    port: 3000,
    db: 'mongodb://localhost/yo-production'
  }*/
};

module.exports = config[env];
