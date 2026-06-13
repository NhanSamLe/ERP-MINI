'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('payroll_configs', {
      id: {
        type: Sequelize.BIGINT,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
      },
      config_key: {
        type: Sequelize.STRING(100),
        allowNull: false,
        unique: true
      },
      config_value: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      description: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Seed default payroll configs directly so they exist immediately!
    const now = new Date();
    await queryInterface.bulkInsert('payroll_configs', [
      { config_key: 'STANDARD_WORK_DAYS', config_value: '26', description: 'Số ngày công chuẩn trong tháng', created_at: now, updated_at: now },
      { config_key: 'PAID_LEAVE', config_value: 'true', description: 'Có tính lương cho ngày nghỉ phép hợp lệ hay không (true/false)', created_at: now, updated_at: now },
      { config_key: 'LATE_FINE_PER_DAY', config_value: '50000', description: 'Số tiền phạt đi trễ mỗi ngày (VND)', created_at: now, updated_at: now },
      { config_key: 'MEAL_ALLOWANCE_PER_DAY', config_value: '30000', description: 'Phụ cấp ăn trưa mỗi ngày công đi làm (VND)', created_at: now, updated_at: now },
      { config_key: 'INSURANCE_BASE_MAX', config_value: '46800000', description: 'Mức trần đóng BHXH/BHYT (VND)', created_at: now, updated_at: now },
      { config_key: 'INSURANCE_BASE_BHTN_MAX', config_value: '99200000', description: 'Mức trần đóng BHTN (VND)', created_at: now, updated_at: now },
      { config_key: 'INS_EMP_SOCIAL_RATE', config_value: '0.08', description: 'Tỷ lệ đóng BHXH của người lao động (8%)', created_at: now, updated_at: now },
      { config_key: 'INS_EMP_HEALTH_RATE', config_value: '0.015', description: 'Tỷ lệ đóng BHYT của người lao động (1.5%)', created_at: now, updated_at: now },
      { config_key: 'INS_EMP_UNEMP_RATE', config_value: '0.01', description: 'Tỷ lệ đóng BHTN của người lao động (1%)', created_at: now, updated_at: now },
      { config_key: 'INS_COMP_SOCIAL_RATE', config_value: '0.175', description: 'Tỷ lệ đóng BHXH của doanh nghiệp (17.5%)', created_at: now, updated_at: now },
      { config_key: 'INS_COMP_HEALTH_RATE', config_value: '0.03', description: 'Tỷ lệ đóng BHYT của doanh nghiệp (3%)', created_at: now, updated_at: now },
      { config_key: 'INS_COMP_UNEMP_RATE', config_value: '0.01', description: 'Tỷ lệ đóng BHTN của doanh nghiệp (1%)', created_at: now, updated_at: now },
      { config_key: 'PERSONAL_DEDUCTION', config_value: '11000000', description: 'Mức giảm trừ gia cảnh cho bản thân (VND)', created_at: now, updated_at: now },
      { config_key: 'DEPENDENT_DEDUCTION', config_value: '4400000', description: 'Mức giảm trừ gia cảnh cho mỗi người phụ thuộc (VND)', created_at: now, updated_at: now }
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('payroll_configs');
  }
};
