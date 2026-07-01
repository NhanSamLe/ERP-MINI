'use strict';

/**
 * Migration: Create stock_in_transit table
 * 
 * Lưu trạng thái hàng hóa đang trên đường vận chuyển giữa 2 kho.
 * Được tạo khi phiếu điều chuyển được approve (phase 1).
 * Bị xóa khi kho đích xác nhận nhận hàng (phase 2).
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('stock_in_transit', {
      id: {
        type: Sequelize.BIGINT,
        autoIncrement: true,
        primaryKey: true,
      },
      stock_move_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        comment: 'Phiếu điều chuyển gốc',
      },
      product_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
      },
      warehouse_from_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        comment: 'Kho xuất',
      },
      warehouse_to_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        comment: 'Kho nhận',
      },
      qty: {
        type: Sequelize.DECIMAL(18, 3),
        allowNull: false,
        comment: 'Số lượng đang vận chuyển (đã quy đổi sang Stock UOM)',
      },
      unit_cost: {
        type: Sequelize.DECIMAL(18, 4),
        allowNull: true,
        comment: 'Giá vốn đơn vị tại thời điểm xuất',
      },
      lot_id: {
        type: Sequelize.BIGINT,
        allowNull: true,
      },
      location_from_id: {
        type: Sequelize.BIGINT,
        allowNull: true,
      },
      location_to_id: {
        type: Sequelize.BIGINT,
        allowNull: true,
      },
      dispatched_at: {
        type: Sequelize.DATE,
        allowNull: false,
        comment: 'Thời gian kho nguồn xuất hàng',
      },
      received_at: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'Thời gian kho đích nhận hàng (null = chưa nhận)',
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
      },
      updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
      },
    });

    // Index để query nhanh theo phiếu điều chuyển
    await queryInterface.addIndex('stock_in_transit', ['stock_move_id']);
    await queryInterface.addIndex('stock_in_transit', ['warehouse_to_id', 'received_at']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('stock_in_transit');
  }
};
