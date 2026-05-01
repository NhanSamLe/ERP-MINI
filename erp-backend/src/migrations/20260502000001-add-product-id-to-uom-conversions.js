"use strict";
module.exports = {
  async up(queryInterface, Sequelize) {
    // Add product_id column (nullable FK → products)
    await queryInterface.addColumn("uom_conversions", "product_id", {
      type: Sequelize.BIGINT,
      allowNull: true,
      after: "id",
      references: { model: "products", key: "id" },
      onDelete: "SET NULL",
    });

    // Add index for priority lookup performance
    await queryInterface.addIndex(
      "uom_conversions",
      ["product_id", "from_uom_id", "to_uom_id"],
      {
        name: "idx_uom_conversions_product_from_to",
      },
    );
  },

  async down(queryInterface) {
    await queryInterface.removeIndex(
      "uom_conversions",
      "idx_uom_conversions_product_from_to",
    );
    await queryInterface.removeColumn("uom_conversions", "product_id");
  },
};
