"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("blog_posts", {
      id: {
        type: Sequelize.BIGINT,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      title: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      slug: {
        type: Sequelize.STRING(255),
        allowNull: false,
        unique: true,
      },
      content: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      summary: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      status: {
        type: Sequelize.ENUM("draft", "published"),
        allowNull: false,
        defaultValue: "draft",
      },
      author_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: { model: "users", key: "id" },
        onDelete: "CASCADE",
      },
      product_id: {
        type: Sequelize.BIGINT,
        allowNull: true,
        references: { model: "products", key: "id" },
        onDelete: "SET NULL",
      },
      seo_title: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      seo_meta_desc: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      seo_keywords: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      image_url: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"),
      },
    });

    await queryInterface.addIndex("blog_posts", ["author_id"], {
      name: "idx_blog_post_author",
    });
    await queryInterface.addIndex("blog_posts", ["product_id"], {
      name: "idx_blog_post_product",
    });
    await queryInterface.addIndex("blog_posts", ["slug"], {
      name: "idx_blog_post_slug",
      unique: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("blog_posts");
  },
};
