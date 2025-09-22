'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('uom_conversions', {
      id: { type: Sequelize.BIGINT, autoIncrement: true, primaryKey: true },
      from_uom_id: { type: Sequelize.BIGINT, allowNull: false },
      to_uom_id: { type: Sequelize.BIGINT, allowNull: false },
      factor: { type: Sequelize.DECIMAL(18,6), allowNull: false },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
    });

    await queryInterface.addConstraint('uom_conversions', {
      fields: ['from_uom_id'],
      type: 'foreign key',
      name: 'fk_conversion_from_uom',
      references: { table: 'uoms', field: 'id' },
      onDelete: 'CASCADE',
    });
    await queryInterface.addConstraint('uom_conversions', {
      fields: ['to_uom_id'],
      type: 'foreign key',
      name: 'fk_conversion_to_uom',
      references: { table: 'uoms', field: 'id' },
      onDelete: 'CASCADE',
    });
  },
  async down(queryInterface) {
    await queryInterface.dropTable('uom_conversions');
  }
};
