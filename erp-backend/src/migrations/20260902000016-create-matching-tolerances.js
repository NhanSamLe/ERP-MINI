'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('matching_tolerances', {
      id: {
        type: Sequelize.BIGINT,
        autoIncrement: true,
        primaryKey: true,
      },
      branch_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
      },
      supplier_id: {
        type: Sequelize.BIGINT,
        allowNull: true,
        comment: 'Áp dụng riêng cho supplier này (null = tất cả)',
      },
      category_id: {
        type: Sequelize.BIGINT,
        allowNull: true,
        comment: 'Áp dụng riêng cho ngành hàng này (null = tất cả)',
      },
      price_tolerance_pct: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: false,
        defaultValue: 0.00,
        comment: 'Phần trăm chênh lệch giá cho phép (ví dụ: 1.50%)',
      },
      qty_tolerance_pct: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: false,
        defaultValue: 0.00,
        comment: 'Phần trăm chênh lệch số lượng cho phép (ví dụ: 2.00%)',
      },
      amount_tolerance_abs: {
        type: Sequelize.DECIMAL(18, 2),
        allowNull: false,
        defaultValue: 0.00,
        comment: 'Chênh lệch số tiền tuyệt đối cho phép (VND)',
      },
      priority: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: 'Độ ưu tiên để chọn rule (số càng lớn độ ưu tiên càng cao)',
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      created_by: {
        type: Sequelize.BIGINT,
        allowNull: false,
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
    });

    await queryInterface.addIndex('matching_tolerances', ['branch_id', 'is_active']);
    await queryInterface.addIndex('matching_tolerances', ['supplier_id', 'category_id']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('matching_tolerances');
  }
};
