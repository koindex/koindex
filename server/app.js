/**
 * Main application file
 */

'use strict';
import express from 'express';
import sqldb from './sqldb';
import config from './config/environment';
import http from 'http';
import initWebSocketServer from './config/websockets';
import expressConfig from './config/express';
import registerRoutes from './routes';
import seedDatabaseIfNeeded from './config/seed';
import redis from './components/redis';


// Setup server
let app = express();
let server = http.createServer(app);
const wsInitPromise = initWebSocketServer(server);
expressConfig(app);
registerRoutes(app);

// Start server
function startServer() {
    testDB();
    testRedis();
    app.angularFullstack = server.listen(config.port, config.ip, function() {
        console.log('Express server listening on %d, in %s mode', config.port, app.get('env'));
    });
}

//Test DB connection
function testDB() {
    sqldb.sequelize
        .authenticate()
        .then(() => {
            console.log('Connection has been established successfully.');
        })
        .catch(err => {
            console.error('Unable to connect to the database:', err);
        });
}

//Test Redis connection
function testRedis() {
    redis.set('test', 'test1', function(err, reply) {
        console.log(reply);
    });
    redis.get('test', function(err, reply) {
        console.log(reply);
    });
}

sqldb.sequelize.sync()
    .then(wsInitPromise)
    .then(primus => {
        app.primus = primus;
    })
    .then(seedDatabaseIfNeeded)
    .then(startServer)
    .catch(err => {
        console.log('Server failed to start due to error: %s', err);
    });

// Expose app
exports = module.exports = app;
