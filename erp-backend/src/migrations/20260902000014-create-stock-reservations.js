'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('stock_reservations', {
      id: {
        type: Sequelize.BIGINT,
        autoIncrement: true,
        primaryKey: true,
      },
      product_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
      },
      warehouse_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
      },
      qty: {
        type: Sequelize.DECIMAL(18, 3),
        allowNull: false,
        comment: 'Số lượng giữ chỗ (đã quy đổi sang Stock UOM)',
      },
      reference_type: {
        type: Sequelize.ENUM('sale_order', 'transfer'),
        allowNull: false,
      },
      reference_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
      },
      status: {
        type: Sequelize.ENUM('active', 'released', 'fulfilled'),
        allowNull: false,
        defaultValue: 'active',
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'),
      },
      released_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      fulfilled_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
    });

    await queryInterface.addIndex('stock_reservations', ['product_id', 'warehouse_id', 'status']);
    await queryInterface.addIndex('stock_reservations', ['reference_type', 'reference_id']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('stock_reservations');
  }
};
