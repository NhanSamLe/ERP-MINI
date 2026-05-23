"use strict";
// Fix 1: Add uom_id to ap_debit_note_lines for consistency with other line tables
// Fix 2: Add 'cancelled' status to vendor_refunds enum for consistency with ap_debit_notes / ap_payments
module.exports = {
    async up(queryInterface, Sequelize) {
        // ─── 1. ap_debit_note_lines: add uom_id ───────────────────────────────────
        const dnLines = await queryInterface.describeTable("ap_debit_note_lines");

        if (!dnLines.uom_id) {
            await queryInterface.addColumn("ap_debit_note_lines", "uom_id", {
                type: Sequelize.BIGINT,
                allowNull: true,
                after: "quantity",
                references: { model: "uoms", key: "id" },
                onDelete: "SET NULL",
                comment: "UOM của quantity — nhất quán với purchase_order_lines, ap_invoice_lines",
            });

            await queryInterface.addIndex("ap_debit_note_lines", ["uom_id"], {
                name: "idx_adnl_uom_id",
            });
        }

        // ─── 2. vendor_refunds: add 'cancelled' to status enum ────────────────────
        await queryInterface.changeColumn("vendor_refunds", "status", {
            type: Sequelize.ENUM("draft", "posted", "cancelled"),
            allowNull: false,
            defaultValue: "draft",
            comment: "draft → posted → cancelled (nhất quán với ap_debit_notes, ap_payments)",
        });
    },

    async down(queryInterface, Sequelize) {
        // ─── 2. vendor_refunds: revert enum về draft/posted ───────────────────────
        await queryInterface.changeColumn("vendor_refunds", "status", {
            type: Sequelize.ENUM("draft", "posted"),
            allowNull: false,
            defaultValue: "draft",
        });

        // ─── 1. ap_debit_note_lines: remove uom_id ────────────────────────────────
        const dnLines = await queryInterface.describeTable("ap_debit_note_lines");

        if (dnLines.uom_id) {
            const indexes = await queryInterface.showIndex("ap_debit_note_lines");
            const uomIdx = indexes.find((idx) => idx.name === "idx_adnl_uom_id");
            if (uomIdx) {
                await queryInterface.removeIndex("ap_debit_note_lines", "idx_adnl_uom_id");
            }
            await queryInterface.removeColumn("ap_debit_note_lines", "uom_id");
        }
    },
};