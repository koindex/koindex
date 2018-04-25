'use strict';
/*eslint no-process-env:0*/

// Production specific configuration
// =================================
module.exports = {
    // Server IP
    ip: process.env.OPENSHIFT_NODEJS_IP
        || process.env.ip
        || undefined,

    // Server port
    port: process.env.OPENSHIFT_NODEJS_PORT
        || process.env.PORT
        || 8080,

    sequelize: {
        uri: process.env.SEQUELIZE_URI||
         'postgres://coinboy:password@localhost:5432/postgres',
        options: {
            logging: false,
            storage: 'dist.sqlite',
            define: {
                timestamps: false
            }
        }
    }
};
