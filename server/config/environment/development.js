'use strict';
/*eslint no-process-env:0*/

// Development specific configuration
// ==================================
module.exports = {

    // Sequelize connection opions
    sequelize: {
        uri: process.env.POSTGRES_URL ||
         'postgres://coinboy:password@localhost:5432/postgres',
        options: {
            logging: false,
            storage: 'dev.sqlite',
            define: {
                timestamps: false
            }
        }
    },

    // Seed database on startup
    seedDB: true
};
