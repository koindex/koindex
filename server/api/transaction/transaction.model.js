'use strict';

export default function(sequelize, DataTypes) {
    return sequelize.define('Transaction', {
        transaction_id: {
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
        operation_type: DataTypes.INTEGER,
        create_at: DataTypes.DATE,
        amount: DataTypes.DECIMAL(19, 2).UNSIGNED
    });
}
