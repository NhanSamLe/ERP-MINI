'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Thay đổi cột status của bảng physical_inventories thành enum mới
    await queryInterface.changeColumn('physical_inventories', 'status', {
      type: Sequelize.ENUM('draft', 'in_progress', 'waiting_approval', 'validated', 'cancelled'),
      allowNull: false,
      defaultValue: 'draft'
    });

    // 2. Thêm các cột cho luồng phê duyệt
    await queryInterface.addColumn('physical_inventories', 'approved_by', {
      type: Sequelize.BIGINT,
      allowNull: true,
      comment: 'Người duyệt phiếu kiểm kê'
    });

    await queryInterface.addColumn('physical_inventories', 'approved_at', {
      type: Sequelize.DATE,
      allowNull: true,
      comment: 'Thời gian duyệt phiếu kiểm kê'
    });

    await queryInterface.addColumn('physical_inventories', 'reject_reason', {
      type: Sequelize.STRING(255),
      allowNull: true,
      comment: 'Lý do từ chối phê duyệt'
    });
  },

  async down(queryInterface, Sequelize) {
    // 1. Rollback cột status về enum cũ
    // Lưu ý: nếu có dữ liệu 'waiting_approval', rollback sẽ báo lỗi MySQL, nhưng trong test/dev thì ok
    await queryInterface.changeColumn('physical_inventories', 'status', {
      type: Sequelize.ENUM('draft', 'in_progress', 'validated', 'cancelled'),
      allowNull: false,
      defaultValue: 'draft'
    });

    // 2. Xóa các cột phê duyệt
    await queryInterface.removeColumn('physical_inventories', 'approved_by');
    await queryInterface.removeColumn('physical_inventories', 'approved_at');
    await queryInterface.removeColumn('physical_inventories', 'reject_reason');
  }
};
