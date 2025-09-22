"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const now = new Date();

    // Tham chiếu chi nhánh
    const [branches] = await queryInterface.sequelize.query(`SELECT id FROM branches;`);
    const branchId = branches[0].id;

    // 1. Departments
    await queryInterface.bulkInsert("departments", [
      {
        branch_id: branchId,
        code: "DEP-SALES",
        name: "Phòng Kinh Doanh",
        created_at: now,
        updated_at: now,
      },
      {
        branch_id: branchId,
        code: "DEP-ACC",
        name: "Phòng Kế Toán",
        created_at: now,
        updated_at: now,
      },
      {
        branch_id: branchId,
        code: "DEP-HR",
        name: "Phòng Nhân Sự",
        created_at: now,
        updated_at: now,
      },
    ]);

    const [departments] = await queryInterface.sequelize.query(`SELECT id, code FROM departments;`);

    function getDepartment(code) {
      return departments.find((d) => d.code === code).id;
    }

    // 2. Positions
    await queryInterface.bulkInsert("positions", [
      {
        branch_id: branchId,
        name: "Nhân viên kinh doanh",
        created_at: now,
        updated_at: now,
      },
      {
        branch_id: branchId,
        name: "Kế toán tổng hợp",
        created_at: now,
        updated_at: now,
      },
      {
        branch_id: branchId,
        name: "HR Executive",
        created_at: now,
        updated_at: now,
      },
    ]);

    const [positions] = await queryInterface.sequelize.query(`SELECT id, name FROM positions;`);

    function getPosition(name) {
      return positions.find((p) => p.name === name).id;
    }

    // 3. Employees
    await queryInterface.bulkInsert("employees", [
      {
        branch_id: branchId,
        emp_code: "EMP001",
        full_name: "Nguyen Van Sales",
        gender: "male",
        birth_date: new Date("1995-05-20"),
        hire_date: new Date("2023-01-15"),
        contract_type: "official",
        department_id: getDepartment("DEP-SALES"),
        position_id: getPosition("Nhân viên kinh doanh"),
        base_salary: 800,
        bank_account: "123456789",
        bank_name: "Vietcombank",
        status: "active",
        created_at: now,
        updated_at: now,
      },
      {
        branch_id: branchId,
        emp_code: "EMP002",
        full_name: "Tran Thi Accountant",
        gender: "female",
        birth_date: new Date("1990-08-10"),
        hire_date: new Date("2022-07-01"),
        contract_type: "official",
        department_id: getDepartment("DEP-ACC"),
        position_id: getPosition("Kế toán tổng hợp"),
        base_salary: 1000,
        bank_account: "987654321",
        bank_name: "ACB",
        status: "active",
        created_at: now,
        updated_at: now,
      },
      {
        branch_id: branchId,
        emp_code: "EMP003",
        full_name: "Le Van HR",
        gender: "male",
        birth_date: new Date("1992-11-25"),
        hire_date: new Date("2021-03-10"),
        contract_type: "official",
        department_id: getDepartment("DEP-HR"),
        position_id: getPosition("HR Executive"),
        base_salary: 900,
        bank_account: "555888333",
        bank_name: "Techcombank",
        status: "active",
        created_at: now,
        updated_at: now,
      },
    ]);

    const [employees] = await queryInterface.sequelize.query(`SELECT id, emp_code FROM employees;`);

    function getEmployee(code) {
      return employees.find((e) => e.emp_code === code).id;
    }

    // 4. Payroll Periods
    await queryInterface.bulkInsert("payroll_periods", [
      {
        branch_id: branchId,
        period_code: "PRD-2025-09",
        start_date: new Date("2025-09-01"),
        end_date: new Date("2025-09-30"),
        status: "open",
        created_at: now,
        updated_at: now,
      },
    ]);

    const [periods] = await queryInterface.sequelize.query(`SELECT id, period_code FROM payroll_periods;`);
    const periodId = periods[0].id;

    // 5. Payroll Runs
    await queryInterface.bulkInsert("payroll_runs", [
      {
        period_id: periodId,
        run_no: "RUN-2025-09-01",
        status: "draft",
        created_at: now,
        updated_at: now,
      },
    ]);

    const [runs] = await queryInterface.sequelize.query(`SELECT id, run_no FROM payroll_runs;`);
    const runId = runs[0].id;

    // 6. Payroll Run Lines
    await queryInterface.bulkInsert("payroll_run_lines", [
      {
        run_id: runId,
        employee_id: getEmployee("EMP001"),
        amount: 800,
        created_at: now,
        updated_at: now,
      },
      {
        run_id: runId,
        employee_id: getEmployee("EMP002"),
        amount: 1000,
        created_at: now,
        updated_at: now,
      },
      {
        run_id: runId,
        employee_id: getEmployee("EMP003"),
        amount: 900,
        created_at: now,
        updated_at: now,
      },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete("payroll_run_lines", null, {});
    await queryInterface.bulkDelete("payroll_runs", null, {});
    await queryInterface.bulkDelete("payroll_periods", null, {});
    await queryInterface.bulkDelete("employees", null, {});
    await queryInterface.bulkDelete("positions", null, {});
    await queryInterface.bulkDelete("departments", null, {});
  },
};
