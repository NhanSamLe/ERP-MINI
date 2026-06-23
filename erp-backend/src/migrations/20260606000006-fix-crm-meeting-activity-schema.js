"use strict";

async function getColumns(queryInterface, tableName) {
  try {
    return await queryInterface.describeTable(tableName);
  } catch {
    return {};
  }
}

module.exports = {
  async up(queryInterface, Sequelize) {
    const table = "crm_activity_meetings";
    const columns = await getColumns(queryInterface, table);

    if (columns.attendees) {
      await queryInterface.changeColumn(table, "attendees", {
        type: Sequelize.TEXT,
        allowNull: true,
      });
    }

    if (!columns.reminder_at) {
      await queryInterface.addColumn(table, "reminder_at", {
        type: Sequelize.DATE,
        allowNull: true,
      });
    }

    if (!columns.cancelled_at) {
      await queryInterface.addColumn(table, "cancelled_at", {
        type: Sequelize.DATE,
        allowNull: true,
      });
    }

    if (!columns.meeting_notes) {
      await queryInterface.addColumn(table, "meeting_notes", {
        type: Sequelize.TEXT,
        allowNull: true,
      });
    }
  },

  async down(queryInterface, Sequelize) {
    const table = "crm_activity_meetings";
    const columns = await getColumns(queryInterface, table);

    if (columns.attendees) {
      await queryInterface.changeColumn(table, "attendees", {
        type: Sequelize.JSON,
        allowNull: true,
      });
    }
  },
};
