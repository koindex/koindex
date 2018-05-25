var index = require('redis');
var client = index.createClient();

client.on('connect', function() {
    console.log('connected');
});

module.exports = client;
