"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const now = new Date();

    // 1. UOM (đơn vị tính)
    await queryInterface.bulkInsert("uoms", [
      { code: "PCS", name: "Piece", created_at: now, updated_at: now },
      { code: "BOX", name: "Box", created_at: now, updated_at: now },
      { code: "KG", name: "Kilogram", created_at: now, updated_at: now },
    ]);

    // 2. Lấy ID UOM để tạo conversion
    const [uoms] = await queryInterface.sequelize.query(`SELECT id, code FROM uoms;`);
    function getUomId(code) {
      return uoms.find((u) => u.code === code).id;
    }

    await queryInterface.bulkInsert("uom_conversions", [
      {
        from_uom_id: getUomId("BOX"),
        to_uom_id: getUomId("PCS"),
        factor: 12,
        created_at: now,
        updated_at: now,
      },
      {
        from_uom_id: getUomId("KG"),
        to_uom_id: getUomId("PCS"),
        factor: 2,
        created_at: now,
        updated_at: now,
      },
    ]);

    // 3. Currency
    await queryInterface.bulkInsert("currencies", [
      { code: "VND", name: "Vietnam Dong", symbol: "₫", created_at: now, updated_at: now },
      { code: "USD", name: "US Dollar", symbol: "$", created_at: now, updated_at: now },
      { code: "EUR", name: "Euro", symbol: "€", created_at: now, updated_at: now },
    ]);

    // 4. Exchange Rate
    const [currencies] = await queryInterface.sequelize.query(`SELECT id, code FROM currencies;`);
    function getCurrencyId(code) {
      return currencies.find((c) => c.code === code).id;
    }

    await queryInterface.bulkInsert("exchange_rates", [
      {
        base_currency_id: getCurrencyId("USD"),
        quote_currency_id: getCurrencyId("VND"),
        rate: 25000,
        valid_date: new Date("2025-01-01"),
        created_at: now,
        updated_at: now,
      },
      {
        base_currency_id: getCurrencyId("EUR"),
        quote_currency_id: getCurrencyId("VND"),
        rate: 27000,
        valid_date: new Date("2025-01-01"),
        created_at: now,
        updated_at: now,
      },
    ]);

    // 5. Tax Rates
    await queryInterface.bulkInsert("tax_rates", [
      {
        code: "VAT10",
        name: "VAT 10%",
        rate: 10,
        is_vat: true,
        effective_date: now,
        status: "active",
        created_at: now,
        updated_at: now,
      },
      {
        code: "VAT5",
        name: "VAT 5%",
        rate: 5,
        is_vat: true,
        effective_date: now,
        status: "active",
        created_at: now,
        updated_at: now,
      },
      {
        code: "NONE",
        name: "No Tax",
        rate: 0,
        is_vat: false,
        effective_date: now,
        status: "active",
        created_at: now,
        updated_at: now,
      },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete("tax_rates", null, {});
    await queryInterface.bulkDelete("exchange_rates", null, {});
    await queryInterface.bulkDelete("currencies", null, {});
    await queryInterface.bulkDelete("uom_conversions", null, {});
    await queryInterface.bulkDelete("uoms", null, {});
  },
};
