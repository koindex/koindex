'use strict';

export default function(sequelize, DataTypes) {
    return sequelize.define('Trade', {
        trade_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true
        },
        bid_id: {
            type: DataTypes.INTEGER,
            references: {
                model: 'Users',
                key: '_id'
            }

        },
        ask_id: {
            type: DataTypes.INTEGER,
            references: {
                model: 'Users',
                key: '_id'
            }

        },
        price: DataTypes.DECIMAL(19, 2).UNSIGNED,
        volumn: DataTypes.DECIMAL(19, 2).UNSIGNED,
        create_at: DataTypes.DATE,
        pair: DataTypes.STRING,
        total_amount: DataTypes.DECIMAL(19, 2).UNSIGNED,
    });
}
