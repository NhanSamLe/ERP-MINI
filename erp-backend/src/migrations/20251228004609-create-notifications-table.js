'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('notifications', {
      id: {
        type: Sequelize.BIGINT,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      user_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onDelete: 'CASCADE',
        comment: 'Người nhận thông báo',
      },
      type: {
        type: Sequelize.ENUM('SUBMIT', 'APPROVE', 'REJECT'),
        allowNull: false,
        comment: 'Loại thông báo',
      },
      title: {
        type: Sequelize.STRING(255),
        allowNull: false,
        comment: 'Tiêu đề thông báo',
      },
      message: {
        type: Sequelize.TEXT,
        allowNull: false,
        comment: 'Nội dung thông báo',
      },
      reference_type: {
        type: Sequelize.ENUM(
          'SALE_ORDER',
          'AR_INVOICE',
          'AR_RECEIPT',
          'PURCHASE_ORDER',
          'AP_INVOICE',
          'AP_PAYMENT'
        ),
        allowNull: false,
        comment: 'Loại chứng từ tham chiếu',
      },
      reference_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        comment: 'ID của chứng từ tham chiếu',
      },
      reference_no: {
        type: Sequelize.STRING(100),
        allowNull: true,
        comment: 'Số chứng từ (để hiển thị)',
      },
      url: {
        type: Sequelize.STRING(500),
        allowNull: true,
        comment: 'URL để điều hướng khi click',
      },
      is_read: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false,
        comment: 'Đã đọc chưa',
      },
      branch_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: {
          model: 'branches',
          key: 'id',
        },
        comment: 'Chi nhánh',
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

    // Indexes để tối ưu query
    await queryInterface.addIndex('notifications', ['user_id', 'is_read'], {
      name: 'idx_notifications_user_read',
    });

    await queryInterface.addIndex('notifications', ['branch_id'], {
      name: 'idx_notifications_branch',
    });

    await queryInterface.addIndex('notifications', ['reference_type', 'reference_id'], {
      name: 'idx_notifications_reference',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('notifications');
  },
};
