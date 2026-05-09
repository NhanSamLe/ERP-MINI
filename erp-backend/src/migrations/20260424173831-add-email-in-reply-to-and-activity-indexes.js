/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // 1. Thêm cột in_reply_to_id vào crm_activity_emails
    await queryInterface.addColumn('crm_activity_emails', 'in_reply_to_id', {
      type: Sequelize.STRING(255),
      allowNull: true,
    });

    // 2. Thêm Composite Index cho bảng crm_activities
    await queryInterface.addIndex('crm_activities', ['related_type', 'related_id'], {
      name: 'idx_crm_activities_related_type_id',
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeIndex('crm_activities', 'idx_crm_activities_related_type_id');
    await queryInterface.removeColumn('crm_activity_emails', 'in_reply_to_id');
  }
};
