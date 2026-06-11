'use strict';

/**
 * Migration: Add in_transit status to stock_moves
 * 
 * Thêm trạng thái in_transit vào stock_moves để hỗ trợ
 * điều chuyển nội bộ 2 bước (2-phase transfer):
 *   draft → waiting_approval → in_transit → posted
 *                                   ↑
 *                           Kho nguồn đã xuất
 *                           Kho đích chưa nhận
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    // MySQL requires dropping and recreating ENUM to add new value
    await queryInterface.changeColumn('stock_moves', 'status', {
      type: Sequelize.ENUM(
        'draft',
        'waiting_approval',
        'in_transit',
        'posted',
        'cancelled'
      ),
      defaultValue: 'draft',
    });
  },

  async down(queryInterface, Sequelize) {
    // Revert: remove in_transit
    await queryInterface.changeColumn('stock_moves', 'status', {
      type: Sequelize.ENUM(
        'draft',
        'waiting_approval',
        'posted',
        'cancelled'
      ),
      defaultValue: 'draft',
    });
  }
};
