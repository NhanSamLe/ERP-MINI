"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("ap_payment_audit_logs", {
      id: {
        type: Sequelize.BIGINT,
        autoIncrement: true,
        primaryKey: true,
      },
      payment_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: { model: "ap_payments", key: "id" },
        onDelete: "CASCADE",
      },
      action: {
        type: Sequelize.STRING(20),
        allowNull: false,
      },
      old_status: {
        type: Sequelize.STRING(50),
        allowNull: true,
      },
      new_status: {
        type: Sequelize.STRING(50),
        allowNull: true,
      },
      details: {
        type: Sequelize.JSON,
        allowNull: true,
      },
      created_by: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: { model: "users", key: "id" },
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
    });

    await queryInterface.addIndex("ap_payment_audit_logs", ["payment_id"]);
    await queryInterface.addIndex("ap_payment_audit_logs", ["created_by"]);
  },

  async down(queryInterface) {
    await queryInterface.dropTable("ap_payment_audit_logs");
  },
};
