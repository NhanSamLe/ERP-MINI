"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("ocr_field_mapping", {
      id: {
        type: Sequelize.BIGINT,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      branch_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: { model: "branches", key: "id" },
        onDelete: "CASCADE",
      },
      vendor_id: {
        type: Sequelize.BIGINT,
        allowNull: true,
        references: { model: "partners", key: "id" },
        onDelete: "SET NULL",
      },
      field_name: {
        type: Sequelize.STRING(50),
        allowNull: false,
      },
      ocr_label: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      confidence: {
        type: Sequelize.DECIMAL(5, 4),
        allowNull: true,
      },
      sample_count: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });

    await queryInterface.addConstraint("ocr_field_mapping", {
      fields: ["branch_id", "vendor_id", "field_name"],
      type: "unique",
      name: "uq_ocr_field_mapping_branch_vendor_field",
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("ocr_field_mapping");
  },
};
