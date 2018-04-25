'use strict';
/*eslint no-process-env:0*/

import path from 'path';
import _ from 'lodash';

/*function requiredProcessEnv(name) {
  if(!process.env[name]) {
    throw new Error('You must set the ' + name + ' environment variable');
  }
  return process.env[name];
}*/

// All configurations will extend these options
// ============================================
var all = {
    env: process.env.NODE_ENV,

    // Root path of server
    root: path.normalize(`${__dirname}/../../..`),

    // dev client port
    clientPort: process.env.CLIENT_PORT || 3000,

    // Server port
    port: process.env.PORT || 9000,

    // Server IP
    ip: process.env.IP || '0.0.0.0',

    // Secret for session, you will want to change this and make it an environment variable
    secrets: {
        session: 'koindex-secret'
    },

    // MongoDB connection options
    // mongo: {
    //     options: {
    //         db: {
    //             safe: true
    //         }
    //     }
    // }
     // Postgres connection options
    postgres: {
          uri: process.env.POSTGRES_URL ||
         'postgres://coinboy:password@localhost:5432/postgres',
          options: {
             db: {
                 safe: true
                }
            }
    },
    database: 'postgres',
    username: 'coinboy',
    password: 'password',
    // Should we populate the DB with sample data?
    seedDB: true,
};

// Export the config object based on the NODE_ENV
// ==============================================
module.exports = _.merge(
    all,
    require('./shared').default,
    require(`./${process.env.NODE_ENV}.js`) || {});
