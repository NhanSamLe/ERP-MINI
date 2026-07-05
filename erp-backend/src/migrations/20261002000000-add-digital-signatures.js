'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Create document_signatures table
    await queryInterface.createTable('document_signatures', {
      id: {
        type: Sequelize.BIGINT,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
      },
      document_type: {
        type: Sequelize.ENUM('purchase_order', 'ap_invoice', 'ap_payment'),
        allowNull: false
      },
      document_id: {
        type: Sequelize.BIGINT,
        allowNull: false
      },
      signer_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      signature_image: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      hash_value: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      signer_ip: {
        type: Sequelize.STRING(45),
        allowNull: true
      },
      signed_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // 2. Add index for quick verification search by hash
    await queryInterface.addIndex('document_signatures', ['hash_value'], {
      name: 'idx_document_signatures_hash'
    });

    // 3. Add signature_pin column to users table
    await queryInterface.addColumn('users', 'signature_pin', {
      type: Sequelize.STRING(255),
      allowNull: true
    });
  },

  async down(queryInterface, Sequelize) {
    // 1. Drop signature_pin from users table
    await queryInterface.removeColumn('users', 'signature_pin');

    // 2. Drop document_signatures table
    await queryInterface.dropTable('document_signatures');
  }
};
