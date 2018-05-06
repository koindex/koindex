/**
 * Sequelize initialization module
 */
import config from '../config/environment';
import Sequelize from 'sequelize';

var db = {
    Sequelize,
    sequelize: new Sequelize(config.sequelize.uri, config.sequelize.options)
};

// Insert models below
db.Thing = db.sequelize.import('../api/thing/thing.model');
db.User = db.sequelize.import('../api/user/user.model');
db.Transaction = db.sequelize.import('../api/transaction/transaction.model');
db.Order = db.sequelize.import('../api/order/order.model');
db.Trade = db.sequelize.import('../api/trade/trade.model');

module.exports = db;
