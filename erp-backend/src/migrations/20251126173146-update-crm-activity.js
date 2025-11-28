"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {

    // ===================================================
    // 1) UPDATE crm_activities (MASTER)
    // ===================================================
    await queryInterface.addColumn("crm_activities", "status", {
      type: Sequelize.ENUM("pending", "in_progress", "completed", "cancelled"),
      defaultValue: "pending",
    });

    await queryInterface.addColumn("crm_activities", "priority", {
      type: Sequelize.ENUM("low", "medium", "high"),
      allowNull: true,
    });

    await queryInterface.addColumn("crm_activities", "is_deleted", {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
    });

    await queryInterface.addColumn("crm_activities", "deleted_at", {
      type: Sequelize.DATE,
      allowNull: true,
    });

    await queryInterface.addColumn("crm_activities", "deleted_by", {
      type: Sequelize.BIGINT,
      allowNull: true,
    });


    // ===================================================
    // 2) UPDATE crm_activity_calls
    // ===================================================

    await queryInterface.changeColumn("crm_activity_calls", "result", {
      type: Sequelize.ENUM(
        "no_answer",
        "busy",
        "connected",
        "failed",
        "call_back",
        "wrong_number"
      ),
      allowNull: true,
    });

    await queryInterface.addColumn("crm_activity_calls", "is_inbound", {
      type: Sequelize.BOOLEAN,
      allowNull: true,
    });


    // ===================================================
    // 3) UPDATE crm_activity_emails
    // ===================================================
    await queryInterface.addColumn("crm_activity_emails", "cc", {
      type: Sequelize.TEXT,
      allowNull: true,
    });

    await queryInterface.addColumn("crm_activity_emails", "bcc", {
      type: Sequelize.TEXT,
      allowNull: true,
    });

    await queryInterface.addColumn("crm_activity_emails", "subject", {
      type: Sequelize.STRING(255),
      allowNull: true,
    });

    await queryInterface.addColumn("crm_activity_emails", "html_body", {
      type: Sequelize.TEXT,
      allowNull: true,
    });

    await queryInterface.addColumn("crm_activity_emails", "text_body", {
      type: Sequelize.TEXT,
      allowNull: true,
    });

    await queryInterface.addColumn("crm_activity_emails", "sent_via", {
      type: Sequelize.STRING(50),
      allowNull: true,
    });

    await queryInterface.addColumn("crm_activity_emails", "error_message", {
      type: Sequelize.STRING(255),
      allowNull: true,
    });


    // ===================================================
    // 4) UPDATE crm_activity_meetings
    // ===================================================
    await queryInterface.changeColumn("crm_activity_meetings", "attendees", {
      type: Sequelize.JSON,
      allowNull: true,
    });

    await queryInterface.addColumn("crm_activity_meetings", "reminder_at", {
      type: Sequelize.DATE,
      allowNull: true,
    });

    await queryInterface.addColumn("crm_activity_meetings", "cancelled_at", {
      type: Sequelize.DATE,
      allowNull: true,
    });

    await queryInterface.addColumn("crm_activity_meetings", "meeting_notes", {
      type: Sequelize.TEXT,
      allowNull: true,
    });


    // ===================================================
    // 5) UPDATE crm_activity_tasks
    // ===================================================
    await queryInterface.changeColumn("crm_activity_tasks", "status", {
      type: Sequelize.ENUM("Not Started", "In Progress", "Completed"),
      defaultValue: "Not Started",
    });
    await queryInterface.removeColumn("crm_activity_tasks", "priority");


  },

  async down(queryInterface, Sequelize) {
    // rollback nếu cần (ngược lại từng field)
  await queryInterface.removeColumn("crm_activities", "status");
  await queryInterface.removeColumn("crm_activities", "priority");
  await queryInterface.removeColumn("crm_activities", "is_deleted");
  await queryInterface.removeColumn("crm_activities", "deleted_at");
  await queryInterface.removeColumn("crm_activities", "deleted_by");
  // ===================================================
  // 5) ROLLBACK crm_activity_tasks
  // ===================================================
  await queryInterface.changeColumn("crm_activity_tasks", "status", {
    type: Sequelize.STRING(50),   // revert về string như ban đầu
    allowNull: true,
  });
  await queryInterface.addColumn("crm_activity_tasks", "priority", {
    type: Sequelize.ENUM("low", "medium", "high"),
    allowNull: true,
  });


  // ===================================================
  // 4) ROLLBACK crm_activity_meetings
  // ===================================================
  await queryInterface.removeColumn("crm_activity_meetings", "reminder_at");
  await queryInterface.removeColumn("crm_activity_meetings", "cancelled_at");
  await queryInterface.removeColumn("crm_activity_meetings", "meeting_notes");

  await queryInterface.changeColumn("crm_activity_meetings", "attendees", {
    type: Sequelize.TEXT,   // hoặc STRING tùy cấu trúc cũ của bạn
    allowNull: true,
  });


  // ===================================================
  // 3) ROLLBACK crm_activity_emails
  // ===================================================
  await queryInterface.removeColumn("crm_activity_emails", "cc");
  await queryInterface.removeColumn("crm_activity_emails", "bcc");
  await queryInterface.removeColumn("crm_activity_emails", "subject");
  await queryInterface.removeColumn("crm_activity_emails", "html_body");
  await queryInterface.removeColumn("crm_activity_emails", "text_body");
  await queryInterface.removeColumn("crm_activity_emails", "sent_via");
  await queryInterface.removeColumn("crm_activity_emails", "error_message");


  // ===================================================
  // 2) ROLLBACK crm_activity_calls
  // ===================================================
  await queryInterface.removeColumn("crm_activity_calls", "is_inbound");

  // revert ENUM về dạng cũ hoặc STRING
  await queryInterface.changeColumn("crm_activity_calls", "result", {
    type: Sequelize.STRING(50),
    allowNull: true,
  });
  
  }
};
