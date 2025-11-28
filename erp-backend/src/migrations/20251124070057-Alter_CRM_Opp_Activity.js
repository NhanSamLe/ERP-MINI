"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    // ============================
    // UPDATE crm_opportunities
    // ============================

    // Thêm closing_date
    await queryInterface.addColumn("crm_opportunities", "closing_date", {
      type: Sequelize.DATE,
      allowNull: true,
    });

    // Thêm loss_reason
    await queryInterface.addColumn("crm_opportunities", "loss_reason", {
      type: Sequelize.STRING(255),
      allowNull: true,
    });

    // Sửa lại stage để có defaultValue = "prospecting"
    await queryInterface.changeColumn("crm_opportunities", "stage", {
      type: Sequelize.ENUM("prospecting", "negotiation", "won", "lost"),
      defaultValue: "prospecting",
      allowNull: false,
    });

    // ============================
    // UPDATE crm_activities
    // ============================

    // Thêm notes
    await queryInterface.addColumn("crm_activities", "notes", {
      type: Sequelize.TEXT,
      allowNull: true,
    });

    // Thêm completed_at
    await queryInterface.addColumn("crm_activities", "completed_at", {
      type: Sequelize.DATE,
      allowNull: true,
    });

    // Thêm is_auto
    await queryInterface.addColumn("crm_activities", "is_auto", {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
    });
  },

  async down(queryInterface, Sequelize) {
    // Revert cho opportunities
    await queryInterface.removeColumn("crm_opportunities", "closing_date");
    await queryInterface.removeColumn("crm_opportunities", "loss_reason");

    // Lưu ý: ENUM không revert lại default được (tuỳ phiên bản),
    // nhưng bạn có thể chỉnh lại như ban đầu nếu muốn.
    
    // Revert cho activities
    await queryInterface.removeColumn("crm_activities", "notes");
    await queryInterface.removeColumn("crm_activities", "completed_at");
    await queryInterface.removeColumn("crm_activities", "is_auto");
  },
};
