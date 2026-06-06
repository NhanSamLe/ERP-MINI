'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Link seeded user sales01 to employee Nguyen Van Sales (EMP001)
    await queryInterface.sequelize.query(`
      UPDATE users u
      JOIN employees e ON e.emp_code = 'EMP001'
      SET u.employee_id = e.id
      WHERE u.username = 'sales01' AND u.employee_id IS NULL;
    `);

    // Link seeded user account01 to employee Tran Thi Accountant (EMP002)
    await queryInterface.sequelize.query(`
      UPDATE users u
      JOIN employees e ON e.emp_code = 'EMP002'
      SET u.employee_id = e.id
      WHERE u.username = 'account01' AND u.employee_id IS NULL;
    `);

    // Link seeded user hrmanager01 to employee Le Van HR (EMP003)
    await queryInterface.sequelize.query(`
      UPDATE users u
      JOIN employees e ON e.emp_code = 'EMP003'
      SET u.employee_id = e.id
      WHERE u.username = 'hrmanager01' AND u.employee_id IS NULL;
    `);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`
      UPDATE users SET employee_id = NULL WHERE username IN ('sales01', 'account01', 'hrmanager01');
    `);
  }
};
