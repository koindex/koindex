'use strict';

export default function(sequelize, DataTypes) {
    return sequelize.define('Order', {
        order_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true,
            autoIncrement: true
        },
        user_id: {
            type: DataTypes.INTEGER,
            references: {
                model: 'Users',
                key: '_id'
            }

        },
        price: DataTypes.DECIMAL(19, 2).UNSIGNED,
        volume: DataTypes.DECIMAL(19, 2).UNSIGNED,
        create_at: DataTypes.DATE,
        state: DataTypes.INTEGER,
        order_status: DataTypes.ENUM('NEW','PARTIALLY_FILLED','FILLED','CANCELED'),
        order_type: DataTypes.ENUM('BUY','SELL'),
        pair: DataTypes.STRING
    });
}
