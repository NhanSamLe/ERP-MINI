import { sequelize } from "../config/db";
import { 
  Company, Branch, User, Product, ProductCategory, Partner, 
  Warehouse, StockLocation, StockBalance, 
  Department, Position, Employee, Attendance, PayrollPeriod, PayrollRun, PayrollRunLine,
  PurchaseRfq, PurchaseRfqLine, PurchaseOrder, PurchaseOrderLine, ApInvoice, ApInvoiceLine, ApPayment,
  Quotation, QuotationLine, SaleOrder, SaleOrderLine, ArInvoice, ArInvoiceLine, ArReceipt, ArReceiptAllocation,
  GlAccount, GlJournal, GlEntry, GlEntryLine,
  Lead, Opportunity, Activity, StockMove, StockMoveLine
} from "../models/index";
import { Op } from "sequelize";

(async () => {
  const transaction = await sequelize.transaction();
  try {
    console.log("Starting RICH Enterprise Data Seeding...");
    await sequelize.query("SET FOREIGN_KEY_CHECKS = 0;", { transaction });

    // -------------------------------------------------------------------------
    // 0. Clean old data (Only clean tables we are going to repopulate)
    // -------------------------------------------------------------------------
    console.log("Cleaning old data...");
    await GlEntryLine.destroy({ where: {}, transaction });
    await GlEntry.destroy({ where: {}, transaction });
    
    await PayrollRunLine.destroy({ where: {}, transaction });
    await PayrollRun.destroy({ where: {}, transaction });
    await PayrollPeriod.destroy({ where: {}, transaction });
    await Attendance.destroy({ where: {}, transaction });
    await Employee.destroy({ where: {}, transaction });
    await Position.destroy({ where: {}, transaction });
    await Department.destroy({ where: {}, transaction });

    await ApPayment.destroy({ where: {}, transaction });
    await ApInvoiceLine.destroy({ where: {}, transaction });
    await ApInvoice.destroy({ where: {}, transaction });
    await PurchaseOrderLine.destroy({ where: {}, transaction });
    await PurchaseOrder.destroy({ where: {}, transaction });
    await PurchaseRfqLine.destroy({ where: {}, transaction });
    await PurchaseRfq.destroy({ where: {}, transaction });

    await ArReceiptAllocation.destroy({ where: {}, transaction });
    await ArReceipt.destroy({ where: {}, transaction });
    await ArInvoiceLine.destroy({ where: {}, transaction });
    await ArInvoice.destroy({ where: {}, transaction });
    await SaleOrderLine.destroy({ where: {}, transaction });
    await SaleOrder.destroy({ where: {}, transaction });
    await QuotationLine.destroy({ where: {}, transaction });
    await Quotation.destroy({ where: {}, transaction });

    await Activity.destroy({ where: {}, transaction });
    await Opportunity.destroy({ where: {}, transaction });
    await Lead.destroy({ where: {}, transaction });

    await StockMoveLine.destroy({ where: {}, transaction });
    await StockMove.destroy({ where: {}, transaction });
    await StockBalance.destroy({ where: {}, transaction });
    await StockLocation.destroy({ where: {}, transaction });
    await Warehouse.destroy({ where: {}, transaction });

    await Partner.destroy({ where: { company_id: 2 }, transaction });
    
    await Product.destroy({ where: { sku: { [Op.like]: 'MINHP-%' } }, transaction });
    await ProductCategory.destroy({ where: { name: { [Op.in]: ["Máy tính & Laptop", "Linh kiện điện tử", "Thiết bị văn phòng", "Linh kiện máy tính", "Phụ kiện công nghệ", "Điện thoại & Máy tính bảng", "Văn phòng phẩm"] } }, transaction });

    // -------------------------------------------------------------------------
    // 1. Rename Company & Branches to be realistic
    // -------------------------------------------------------------------------
    console.log("Updating Company & Branches...");
    await Company.update(
      { name: "Công ty TNHH Giải pháp Công nghệ Minh Phát" },
      { where: { id: 2 }, transaction }
    );
    await Branch.update(
      { name: "Chi nhánh Hồ Chí Minh" },
      { where: { id: 2 }, transaction }
    );
    await Branch.update(
      { name: "Chi nhánh Hà Nội" },
      { where: { id: 3 }, transaction }
    );

    // -------------------------------------------------------------------------
    // 2. Seed Categories & Products (20 products)
    // -------------------------------------------------------------------------
    console.log("Seeding Categories & 20 Products...");
    const catLaptop = await ProductCategory.create({ name: "Máy tính & Laptop", status: true }, { transaction }) as any;
    const catPart = await ProductCategory.create({ name: "Linh kiện điện tử", status: true }, { transaction }) as any;
    const catOffice = await ProductCategory.create({ name: "Thiết bị văn phòng", status: true }, { transaction }) as any;
    const catComponent = await ProductCategory.create({ name: "Linh kiện máy tính", status: true }, { transaction }) as any;
    const catPhone = await ProductCategory.create({ name: "Điện thoại & Máy tính bảng", status: true }, { transaction }) as any;
    const catStationery = await ProductCategory.create({ name: "Văn phòng phẩm", status: true }, { transaction }) as any;

    const productsData = [
      // Laptops
      { category_id: catLaptop.id, sku: "MINHP-LAP-DELL", name: "Laptop Dell XPS 13 9320", cost_price: 18000000, sale_price: 25000000, origin: "USA", uom_id: 1, purchase_uom_id: 1, tax_rate_id: 1 },
      { category_id: catLaptop.id, sku: "MINHP-LAP-MAC", name: "MacBook Air M2 2023 16GB", cost_price: 21000000, sale_price: 28500000, origin: "China", uom_id: 1, purchase_uom_id: 1, tax_rate_id: 1 },
      { category_id: catLaptop.id, sku: "MINHP-LAP-ASUS", name: "ASUS ROG Strix G16 Gaming Laptop", cost_price: 28000000, sale_price: 36000000, origin: "Taiwan", uom_id: 1, purchase_uom_id: 1, tax_rate_id: 1 },
      
      // Parts & Accessories
      { category_id: catPart.id, sku: "MINHP-ACC-KEY", name: "Bàn phím cơ không dây Keychron K2 V2", cost_price: 1200000, sale_price: 1950000, origin: "China", uom_id: 1, purchase_uom_id: 1, tax_rate_id: 1 },
      { category_id: catPart.id, sku: "MINHP-ACC-MOU", name: "Chuột không dây Logitech MX Master 3S", cost_price: 1600000, sale_price: 2450000, origin: "China", uom_id: 1, purchase_uom_id: 1, tax_rate_id: 1 },
      { category_id: catPart.id, sku: "MINHP-ACC-MON", name: "Màn hình Dell UltraSharp 27\" U2723QE", cost_price: 7200000, sale_price: 9900000, origin: "China", uom_id: 1, purchase_uom_id: 1, tax_rate_id: 1 },

      // Office items
      { category_id: catOffice.id, sku: "MINHP-OFF-CHAIR", name: "Ghế công thái học Ergonomic Herman Miller Aeron", cost_price: 32000000, sale_price: 46000000, origin: "USA", uom_id: 1, purchase_uom_id: 1, tax_rate_id: 1 },
      { category_id: catOffice.id, sku: "MINHP-OFF-DESK", name: "Bàn làm việc nâng hạ thông minh SmartDesk Pro", cost_price: 4800000, sale_price: 7500000, origin: "China", uom_id: 1, purchase_uom_id: 1, tax_rate_id: 1 },

      // Phones & Tablets
      { category_id: catPhone.id, sku: "MINHP-TEL-IPHONE", name: "iPhone 15 Pro Max 256GB Titan", cost_price: 24000000, sale_price: 30000000, origin: "China", uom_id: 1, purchase_uom_id: 1, tax_rate_id: 1 },
      { category_id: catPhone.id, sku: "MINHP-TEL-IPAD", name: "iPad Pro M2 11\" Wifi 128GB", cost_price: 17000000, sale_price: 22000000, origin: "China", uom_id: 1, purchase_uom_id: 1, tax_rate_id: 1 },
      { category_id: catPhone.id, sku: "MINHP-TEL-SAMSUNG", name: "Samsung Galaxy S24 Ultra 5G", cost_price: 22000000, sale_price: 28000000, origin: "Korea", uom_id: 1, purchase_uom_id: 1, tax_rate_id: 1 },

      // PC Components
      { category_id: catComponent.id, sku: "MINHP-COM-CPU", name: "Bộ vi xử lý Intel Core i9-14900K", cost_price: 11500000, sale_price: 14500000, origin: "Malaysia", uom_id: 1, purchase_uom_id: 1, tax_rate_id: 1 },
      { category_id: catComponent.id, sku: "MINHP-COM-GPU", name: "Card đồ họa NVIDIA RTX 4070 Ti ASUS TUF", cost_price: 18000000, sale_price: 22500000, origin: "China", uom_id: 1, purchase_uom_id: 1, tax_rate_id: 1 },
      { category_id: catComponent.id, sku: "MINHP-COM-RAM", name: "Bộ nhớ RAM Corsair Vengeance DDR5 32GB", cost_price: 2000000, sale_price: 2800000, origin: "China", uom_id: 1, purchase_uom_id: 1, tax_rate_id: 1 },
      { category_id: catComponent.id, sku: "MINHP-COM-SSD", name: "Ổ cứng SSD Samsung 990 Pro 1TB NVMe", cost_price: 2400000, sale_price: 3200000, origin: "Korea", uom_id: 1, purchase_uom_id: 1, tax_rate_id: 1 },

      // PC Sound
      { category_id: catPart.id, sku: "MINHP-ACC-EAR", name: "Tai nghe chống ồn Sony WH-1000XM5", cost_price: 5500000, sale_price: 7900000, origin: "Malaysia", uom_id: 1, purchase_uom_id: 1, tax_rate_id: 1 },
      { category_id: catPart.id, sku: "MINHP-ACC-SPK", name: "Loa Bluetooth Marshall Acton III", cost_price: 4800000, sale_price: 6800000, origin: "China", uom_id: 1, purchase_uom_id: 1, tax_rate_id: 1 },

      // Stationery & Office tech
      { category_id: catOffice.id, sku: "MINHP-OFF-PRINTER", name: "Máy in Laser đa năng HP LaserJet Pro", cost_price: 3800000, sale_price: 5500000, origin: "China", uom_id: 1, purchase_uom_id: 1, tax_rate_id: 1 },
      { category_id: catStationery.id, sku: "MINHP-STA-PAPER", name: "Thùng Giấy in Double A A4 80gsm (5 ream)", cost_price: 250000, sale_price: 350000, origin: "Thailand", uom_id: 2, purchase_uom_id: 2, tax_rate_id: 1 },
      { category_id: catStationery.id, sku: "MINHP-STA-PEN", name: "Hộp Bút bi Thiên Long (20 cây/hộp)", cost_price: 80000, sale_price: 120000, origin: "Vietnam", uom_id: 1, purchase_uom_id: 1, tax_rate_id: 1 },
    ];

    const products: any[] = [];
    for (const p of productsData) {
      const prod = await Product.create(p as any, { transaction });
      products.push(prod);
    }

    // -------------------------------------------------------------------------
    // 3. Seed Warehouses, Locations & Balances
    // -------------------------------------------------------------------------
    console.log("Seeding Warehouses, Locations & Balances...");
    const whHcm = await Warehouse.create({ branch_id: 2, code: "WH-MINHP-HCM", name: "Kho tổng Minh Phát Hồ Chí Minh", address: "Quận 9, TP. Hồ Chí Minh" }, { transaction }) as any;
    const whHn = await Warehouse.create({ branch_id: 3, code: "WH-MINHP-HN", name: "Kho phụ Minh Phát Hà Nội", address: "Cầu Giấy, Hà Nội" }, { transaction }) as any;

    const locHcm = await StockLocation.create({ warehouse_id: whHcm.id, name: "Khu vực lưu trữ 01", code: "LOC-HCM-01", type: "internal" }, { transaction }) as any;
    const locHn = await StockLocation.create({ warehouse_id: whHn.id, name: "Khu vực kệ A1", code: "LOC-HN-A1", type: "internal" }, { transaction }) as any;

    // Seed Balances for all 20 products
    for (const prod of products) {
      await StockBalance.create({
        warehouse_id: whHcm.id,
        product_id: prod.id,
        location_id: locHcm.id,
        quantity: 120,
        reserved_qty: 0,
        unit_cost: prod.cost_price,
        total_value: 120 * (prod.cost_price || 0)
      }, { transaction });

      await StockBalance.create({
        warehouse_id: whHn.id,
        product_id: prod.id,
        location_id: locHn.id,
        quantity: 60,
        reserved_qty: 0,
        unit_cost: prod.cost_price,
        total_value: 60 * (prod.cost_price || 0)
      }, { transaction });
    }

    // -------------------------------------------------------------------------
    // 4. Seed Partners (15 Customers & 8 Suppliers)
    // -------------------------------------------------------------------------
    console.log("Seeding 15 Customers & 8 Suppliers...");
    const customersData: any[] = [
      { company_id: 2, type: "customer", name: "Công ty Cổ phần VNG", contact_person: "Nguyễn Văn Hùng", phone: "0901234567", email: "hungnv@vng.com.vn", tax_code: "0303867890", address: "Z06 Đường số 13, Tân Thuận Đông, Quận 7, TP. HCM", currency_id: 1, payment_term_id: 3, credit_limit: 500000000, is_customer: true, is_supplier: false },
      { company_id: 2, type: "customer", name: "Công ty TNHH FPT Software", contact_person: "Trần Thị Mai", phone: "0912345678", email: "maitt@fsoft.com.vn", tax_code: "0101247890", address: "Lô T2, Đường D1, Khu Công Nghệ Cao, Quận 9, TP. HCM", currency_id: 1, payment_term_id: 3, credit_limit: 300000000, is_customer: true, is_supplier: false },
      { company_id: 2, type: "customer", name: "Tập đoàn Viễn thông Quân đội (Viettel)", contact_person: "Phạm Minh Tuấn", phone: "0987654321", email: "tuanpm@viettel.com.vn", tax_code: "0100109106", address: "Lô D26, Khu đô thị mới Cầu Giấy, Yên Hòa, Cầu Giấy, Hà Nội", currency_id: 1, payment_term_id: 2, credit_limit: 800000000, is_customer: true, is_supplier: false },
      { company_id: 2, type: "customer", name: "Ngân hàng TMCP Ngoại thương Việt Nam (Vietcombank)", contact_person: "Hoàng Văn Hậu", phone: "0919283746", email: "hauhv@vietcombank.com.vn", tax_code: "0100112437", address: "198 Trần Quang Khải, Hoàn Kiếm, Hà Nội", currency_id: 1, payment_term_id: 3, credit_limit: 1000000000, is_customer: true, is_supplier: false },
      { company_id: 2, type: "customer", name: "Công ty Cổ phần sữa Việt Nam (Vinamilk)", contact_person: "Lê Hoàng Yến", phone: "0908172635", email: "yenlh@vinamilk.com.vn", tax_code: "0300588569", address: "10 Tân Trào, Tân Phú, Quận 7, TP. HCM", currency_id: 1, payment_term_id: 3, credit_limit: 600000000, is_customer: true, is_supplier: false },
      { company_id: 2, type: "customer", name: "Tập đoàn Vingroup", contact_person: "Vũ Đăng Khoa", phone: "0903344556", email: "khoavd@vingroup.net", tax_code: "0101245486", address: "Số 7 Đường Bằng Lăng 1, Việt Hưng, Long Biên, Hà Nội", currency_id: 1, payment_term_id: 3, credit_limit: 1500000000, is_customer: true, is_supplier: false },
      { company_id: 2, type: "customer", name: "Công ty Cổ phần Đầu tư Thế Giới Di Động", contact_person: "Nguyễn Đức Tài", phone: "02838125960", email: "tai.nd@thegioididong.com", tax_code: "0303217354", address: "Lô T2-1.2 đường D1, Khu Công Nghệ Cao, Quận 9, TP. HCM", currency_id: 1, payment_term_id: 3, credit_limit: 700000000, is_customer: true, is_supplier: false },
      { company_id: 2, type: "customer", name: "Tổng công ty Cảng hàng không Việt Nam (ACV)", contact_person: "Trần Anh Tú", phone: "0982345671", email: "tutr@vietnamairport.vn", tax_code: "0311638525", address: "58 Trường Sơn, Phường 2, Tân Bình, TP. HCM", currency_id: 1, payment_term_id: 2, credit_limit: 500000000, is_customer: true, is_supplier: false },
      { company_id: 2, type: "customer", name: "Tập đoàn Masan", contact_person: "Nguyễn Thiện Nhân", phone: "0918273645", email: "nhannt@masangroup.com", tax_code: "0302861614", address: "82 Song Hành, An Phú, Quận 2, TP. HCM", currency_id: 1, payment_term_id: 3, credit_limit: 450000000, is_customer: true, is_supplier: false },
      { company_id: 2, type: "customer", name: "Công ty Cổ phần FPT", contact_person: "Bùi Quang Ngọc", phone: "02473007300", email: "ngocbq@fpt.com.vn", tax_code: "0100277401", address: "Tòa nhà FPT, Phố Duy Tân, Dịch Vọng Hậu, Cầu Giấy, Hà Nội", currency_id: 1, payment_term_id: 3, credit_limit: 900000000, is_customer: true, is_supplier: false },
      { company_id: 2, type: "customer", name: "Ngân hàng TMCP Kỹ thương Việt Nam (Techcombank)", contact_person: "Hồ Hùng Anh", phone: "02439446368", email: "anhhh@techcombank.com.vn", tax_code: "0100230800", address: "119 Trần Hưng Đạo, Cửa Nam, Hoàn Kiếm, Hà Nội", currency_id: 1, payment_term_id: 3, credit_limit: 1200000000, is_customer: true, is_supplier: false },
      { company_id: 2, type: "customer", name: "Tập đoàn Điện lực Việt Nam (EVN)", contact_person: "Dương Quang Thành", phone: "02466946789", email: "thanhdq@evn.com.vn", tax_code: "0100100079", address: "11 Cửa Bắc, Trúc Bạch, Ba Đình, Hà Nội", currency_id: 1, payment_term_id: 2, credit_limit: 1000000000, is_customer: true, is_supplier: false },
      { company_id: 2, type: "customer", name: "Công ty TNHH Samsung Electronics Việt Nam", contact_person: "Lee Jae Yong", phone: "02223696111", email: "samsung.vn@samsung.com", tax_code: "2300344556", address: "KCN Yên Phong, Yên Trung, Yên Phong, Bắc Ninh", currency_id: 1, payment_term_id: 3, credit_limit: 2000000000, is_customer: true, is_supplier: false },
      { company_id: 2, type: "customer", name: "Công ty TNHH Shopee Việt Nam", contact_person: "Pine Kyaw", phone: "02873020079", email: "pine.kyaw@shopee.vn", tax_code: "0313508165", address: "Tầng 17, Tòa nhà Saigon Centre 2, 67 Lê Lợi, Quận 1, TP. HCM", currency_id: 1, payment_term_id: 3, credit_limit: 800000000, is_customer: true, is_supplier: false },
      { company_id: 2, type: "customer", name: "Công ty TNHH Grab Việt Nam", contact_person: "Nguyễn Thái Hải Vân", phone: "02871087108", email: "van.nguyen@grab.com", tax_code: "0312650437", address: "Tòa nhà Mapletree Business Centre, 1060 Nguyễn Văn Linh, Quận 7, TP. HCM", currency_id: 1, payment_term_id: 3, credit_limit: 600000000, is_customer: true, is_supplier: false }
    ];

    const suppliersData: any[] = [
      { company_id: 2, type: "supplier", name: "Công ty Cổ phần Máy tính Phong Vũ", contact_person: "Lê Minh Trí", phone: "02873016868", email: "sales@phongvu.vn", tax_code: "0304968832", address: "264 Nguyễn Thị Minh Khai, Phường 6, Quận 3, TP. HCM", currency_id: 1, payment_term_id: 2, credit_limit: 1000000000, is_customer: false, is_supplier: true },
      { company_id: 2, type: "supplier", name: "Công ty Cổ phần Thế Giới Số (Digiworld)", contact_person: "Nguyễn Thị Ngọc", phone: "02839290808", email: "contact@digiworld.com.vn", tax_code: "0302861750", address: "195-197 Nguyễn Thái Bình, Quận 1, TP. HCM", currency_id: 1, payment_term_id: 3, credit_limit: 1500000000, is_customer: false, is_supplier: true },
      { company_id: 2, type: "supplier", name: "FPT Synnex", contact_person: "Hoàng Minh Anh", phone: "02473007300", email: "minhanh@synnex.fpt.com.vn", tax_code: "0102654381", address: "Tòa nhà FPT, Cầu Giấy, Hà Nội", currency_id: 1, payment_term_id: 3, credit_limit: 1200000000, is_customer: false, is_supplier: true },
      { company_id: 2, type: "supplier", name: "Công ty Cổ phần Dịch vụ Phân phối Tổng hợp Dầu khí (PSD)", contact_person: "Phùng Tuấn Hà", phone: "02839115568", email: "info@psd.com.vn", tax_code: "0305047864", address: "1-5 Lê Duẩn, Bến Nghé, Quận 1, TP. HCM", currency_id: 1, payment_term_id: 2, credit_limit: 900000000, is_customer: false, is_supplier: true },
      { company_id: 2, type: "supplier", name: "Công ty TNHH Viết Sơn", contact_person: "Nguyễn Viết Sơn", phone: "02839293726", email: "sonnv@vietson.cz", tax_code: "0301467439", address: "150 Bùi Thị Xuân, Quận 1, TP. HCM", currency_id: 1, payment_term_id: 2, credit_limit: 500000000, is_customer: false, is_supplier: true },
      { company_id: 2, type: "supplier", name: "Công ty TNHH Máy tính Vĩnh Xuân", contact_person: "Trần Thị Xuân", phone: "02439743456", email: "xuantt@vinhxuan.com.vn", tax_code: "0100984372", address: "39 Trần Quốc Toản, Hoàn Kiếm, Hà Nội", currency_id: 1, payment_term_id: 2, credit_limit: 600000000, is_customer: false, is_supplier: true },
      { company_id: 2, type: "supplier", name: "Nhà phân phối Công nghệ Anh Ngọc", contact_person: "Nguyễn Anh Ngọc", phone: "02437343734", email: "sales@anhngoc.vn", tax_code: "0101894372", address: "12 Lô 2C Khu đô thị Trung Yên, Cầu Giấy, Hà Nội", currency_id: 1, payment_term_id: 2, credit_limit: 800000000, is_customer: false, is_supplier: true },
      { company_id: 2, type: "supplier", name: "Công ty TNHH Phân phối Tin học Minh Thông", contact_person: "Lâm Minh Thông", phone: "02838393839", email: "sales@minhthong.com.vn", tax_code: "0301847321", address: "105 Cống Quỳnh, Quận 1, TP. HCM", currency_id: 1, payment_term_id: 3, credit_limit: 400000000, is_customer: false, is_supplier: true }
    ];

    const customers: any[] = [];
    for (const c of customersData) {
      const cust = await Partner.create(c, { transaction });
      customers.push(cust);
    }

    const suppliers: any[] = [];
    for (const s of suppliersData) {
      const sup = await Partner.create(s, { transaction });
      suppliers.push(sup);
    }

    // -------------------------------------------------------------------------
    // 5. Seed CRM (8 Leads, 6 Opportunities, 15 Activities)
    // -------------------------------------------------------------------------
    console.log("Seeding CRM module (Leads & Opportunities)...");
    const leadSales = 7;
    const leadThan = 16;
    const leadMgr = 6;

    const leadsData = [
      { branch_id: 2, name: "Nguyễn Văn Hùng", company_name: "Công ty Cổ phần VNG", email: "hungnv@vng.com.vn", phone: "0901234567", stage: "qualified", source_id: 1, assigned_to: leadSales, created_by: leadSales },
      { branch_id: 2, name: "Trần Thị Mai", company_name: "Công ty TNHH FPT Software", email: "maitt@fsoft.com.vn", phone: "0912345678", stage: "qualified", source_id: 2, assigned_to: leadThan, created_by: leadThan },
      { branch_id: 3, name: "Phạm Minh Tuấn", company_name: "Tập đoàn Viettel", email: "tuanpm@viettel.com.vn", phone: "0987654321", stage: "qualified", source_id: 3, assigned_to: leadSales, created_by: leadSales },
      { branch_id: 2, name: "Lê Hoàng Yến", company_name: "Công ty Cổ phần sữa Vinamilk", email: "yenlh@vinamilk.com.vn", phone: "0908172635", stage: "new", source_id: 1, assigned_to: leadThan, created_by: leadThan },
      { branch_id: 3, name: "Vũ Đăng Khoa", company_name: "Tập đoàn Vingroup", email: "khoavd@vingroup.net", phone: "0903344556", stage: "lost", lost_reason: "Giá quá cao so với ngân sách dự kiến", source_id: 2, assigned_to: leadMgr, created_by: leadMgr },
      { branch_id: 2, name: "Nguyễn Đức Tài", company_name: "Công ty Thế Giới Di Động", email: "tai.nd@thegioididong.com", phone: "02838125960", stage: "qualified", source_id: 3, assigned_to: leadSales, created_by: leadSales },
      { branch_id: 2, name: "Pine Kyaw", company_name: "Công ty Shopee Việt Nam", email: "pine.kyaw@shopee.vn", phone: "02873020079", stage: "new", source_id: 1, assigned_to: leadThan, created_by: leadThan },
      { branch_id: 2, name: "Nguyễn Thái Hải Vân", company_name: "Công ty Grab Việt Nam", email: "van.nguyen@grab.com", phone: "02871087108", stage: "lost", lost_reason: "Chọn đơn vị khác có dịch vụ kỹ thuật đi kèm", source_id: 2, assigned_to: leadSales, created_by: leadSales }
    ];

    const leads: any[] = [];
    for (const l of leadsData) {
      const ld = await Lead.create(l as any, { transaction });
      leads.push(ld);
    }

    const opportunitiesData = [
      { branch_id: 2, lead_id: leads[0].id, name: "Dự án Nâng cấp Phòng Họp VNG 2026", customer_id: customers[0].id, stage: "prospecting", expected_value: 120000000, probability: 40, closing_date: new Date("2026-07-15"), owner_id: leadSales, created_by: leadSales },
      { branch_id: 2, lead_id: leads[1].id, name: "Cung cấp Macbook cho FPT Software 2026", customer_id: customers[1].id, stage: "negotiation", expected_value: 350000000, probability: 70, closing_date: new Date("2026-08-30"), owner_id: leadThan, created_by: leadThan },
      { branch_id: 2, lead_id: leads[5].id, name: "Trang bị màn hình Dell Thế Giới Di Động", customer_id: customers[6].id, stage: "won", expected_value: 200000000, probability: 100, closing_date: new Date("2026-06-20"), owner_id: leadSales, created_by: leadSales },
      { branch_id: 3, lead_id: leads[2].id, name: "Trang bị ghế Aeron cho Techcombank VIP", customer_id: customers[10].id, stage: "prospecting", expected_value: 90000000, probability: 30, closing_date: new Date("2026-09-05"), owner_id: leadSales, created_by: leadSales },
      { branch_id: 2, lead_id: leads[6].id, name: "Trang bị ghế Herman Miller cho Shopee", customer_id: customers[13].id, stage: "negotiation", expected_value: 460000000, probability: 60, closing_date: new Date("2026-08-10"), owner_id: leadThan, created_by: leadThan },
      { branch_id: 2, lead_id: leads[7].id, name: "Cung cấp điện thoại dự phòng Grab", customer_id: customers[14].id, stage: "lost", expected_value: 150000000, probability: 0, closing_date: new Date("2026-06-25"), owner_id: leadSales, created_by: leadSales }
    ];

    const opportunities: any[] = [];
    for (const o of opportunitiesData) {
      const opt = await Opportunity.create(o as any, { transaction });
      opportunities.push(opt);
    }

    // Seed 15 CRM activities showing a rich activity logs history!
    console.log("Seeding CRM Activities...");
    const activitiesData = [
      { owner_id: leadSales, subject: "Gọi điện tư vấn cấu hình Dell XPS", activity_type: "call", status: "completed", due_at: new Date("2026-06-01"), related_type: "opportunity", related_id: opportunities[0].id, notes: "Đã gọi điện tư vấn và anh Hùng đồng ý xem cấu hình đề xuất." },
      { owner_id: leadSales, subject: "Gửi báo giá chính thức Dell XPS", activity_type: "email", status: "completed", due_at: new Date("2026-06-03"), related_type: "opportunity", related_id: opportunities[0].id, notes: "Gửi kèm file PDF báo giá chi tiết 1 Dell XPS 13." },
      { owner_id: leadThan, subject: "Họp đàm phán hợp đồng Macbook FPT", activity_type: "meeting", status: "completed", due_at: new Date("2026-06-05"), related_type: "opportunity", related_id: opportunities[1].id, notes: "Khách yêu cầu giảm giá thêm 2% nếu mua số lượng trên 10 máy." },
      { owner_id: leadThan, subject: "Gửi dự thảo hợp đồng mua bán Macbook", activity_type: "email", status: "completed", due_at: new Date("2026-06-08"), related_type: "opportunity", related_id: opportunities[1].id, notes: "Đã gửi bản dự thảo qua email cho chị Mai duyệt." },
      { owner_id: leadSales, subject: "Khảo sát mặt bằng TGDĐ để lắp màn hình", activity_type: "meeting", status: "completed", due_at: new Date("2026-06-10"), related_type: "opportunity", related_id: opportunities[2].id, notes: "Đã khảo sát và xác định các thông số giá treo và cáp kết nối phù hợp." },
      { owner_id: leadSales, subject: "Giao hàng và nghiệm thu lắp đặt màn hình", activity_type: "task", status: "completed", due_at: new Date("2026-06-15"), related_type: "opportunity", related_id: opportunities[2].id, notes: "Nghiệm thu thành công 20 màn hình Dell hoạt động tốt." },
      { owner_id: leadSales, subject: "Liên hệ tìm hiểu nhu cầu của Techcombank", activity_type: "call", status: "completed", due_at: new Date("2026-06-12"), related_type: "opportunity", related_id: opportunities[3].id, notes: "Đã giới thiệu các dòng ghế Aeron của Herman Miller cho phòng VIP." },
      { owner_id: leadSales, subject: "Gửi catalogue ghế công thái học", activity_type: "email", status: "pending", due_at: new Date("2026-07-02"), related_type: "opportunity", related_id: opportunities[3].id, notes: "Cần chọn lọc các dòng sản phẩm màu đen và xám gửi đi." },
      { owner_id: leadThan, subject: "Demo ghế Herman Miller tại văn phòng Shopee", activity_type: "meeting", status: "completed", due_at: new Date("2026-06-18"), related_type: "opportunity", related_id: opportunities[4].id, notes: "Đã gửi 2 chiếc ghế mẫu đến văn phòng Shopee để họ dùng thử." },
      { owner_id: leadThan, subject: "Họp bàn về phương án tài chính với Shopee", activity_type: "meeting", status: "pending", due_at: new Date("2026-07-05"), related_type: "opportunity", related_id: opportunities[4].id, notes: "Chuẩn bị phương án chiết khấu thương mại và kỳ hạn thanh toán." },
      { owner_id: leadSales, subject: "Chào hàng điện thoại Samsung cho Grab", activity_type: "call", status: "completed", due_at: new Date("2026-06-20"), related_type: "opportunity", related_id: opportunities[5].id, notes: "Đã báo giá dòng S24 Ultra làm quà tặng đối tác lái xe VIP." },
      { owner_id: leadSales, subject: "Grab phản hồi từ chối mua hàng", activity_type: "email", status: "completed", due_at: new Date("2026-06-24"), related_type: "opportunity", related_id: opportunities[5].id, notes: "Đã nhận được email phản hồi từ chối do chính sách hỗ trợ kỹ thuật không đạt yêu cầu." },
      { owner_id: leadSales, subject: "Theo dõi phản hồi dự án phòng họp VNG", activity_type: "call", status: "pending", due_at: new Date("2026-07-01"), related_type: "opportunity", related_id: opportunities[0].id, notes: "Cần gọi lại hỏi anh Hùng về tiến độ duyệt báo giá." },
      { owner_id: leadThan, subject: "Gọi lại xác nhận nhu cầu của Vinamilk", activity_type: "call", status: "pending", due_at: new Date("2026-07-03"), related_type: "lead", related_id: leads[3].id, notes: "Cần tìm hiểu họ muốn mua máy tính để bàn hay laptop cho kế toán." },
      { owner_id: leadThan, subject: "Theo dõi tình hình lead Shopee mới", activity_type: "task", status: "pending", due_at: new Date("2026-07-04"), related_type: "lead", related_id: leads[6].id, notes: "Nghiên cứu hồ sơ và cơ cấu phòng mua hàng của Shopee trước khi gọi." }
    ];

    for (const a of activitiesData) {
      await Activity.create(a as any, { transaction });
    }

    // -------------------------------------------------------------------------
    // 6. Seed Quotations & Sales Orders
    // -------------------------------------------------------------------------
    console.log("Seeding Quotations & Sales Orders...");
    
    // Q1 (VNG): accepted, approved
    const q1 = await Quotation.create({
      branch_id: 2,
      quotation_no: "BG-2026-06-0001",
      customer_id: customers[0].id,
      opportunity_id: opportunities[0].id,
      valid_until: "2026-07-30",
      quotation_date: "2026-06-10",
      status: "accepted",
      approval_status: "approved",
      total_before_tax: 25000000,
      total_tax: 2500000,
      total_after_tax: 27500000,
      discount_percent: 0,
      discount_amount: 0,
      version: 1,
      parent_id: null,
      customer_notes: null,
      internal_notes: null,
      sales_person_id: leadSales,
      created_by: leadSales,
      approved_by: leadMgr,
      submitted_at: new Date("2026-06-10"),
      approved_at: new Date("2026-06-11"),
      reject_reason: null,
      sent_at: new Date("2026-06-10")
    } as any, { transaction }) as any;

    await QuotationLine.create({
      quotation_id: q1.id,
      product_id: products[0].id, // Laptop Dell
      quantity: 1,
      unit_price: 25000000,
      tax_rate_id: 1,
      line_total: 25000000,
      line_tax: 2500000,
      line_total_after_tax: 27500000,
      discount_percent: 0,
      discount_amount: 0,
      uom_id: 1
    }, { transaction });

    // Q2 (FPT): accepted, approved
    const q2 = await Quotation.create({
      branch_id: 2,
      quotation_no: "BG-2026-06-0002",
      customer_id: customers[1].id,
      opportunity_id: opportunities[1].id,
      valid_until: "2026-08-30",
      quotation_date: "2026-06-12",
      status: "accepted",
      approval_status: "approved",
      total_before_tax: 28500000 * 12, // 12 Macbooks
      total_tax: 28500000 * 12 * 0.1,
      total_after_tax: 28500000 * 12 * 1.1,
      discount_percent: 0,
      discount_amount: 0,
      version: 1,
      parent_id: null,
      customer_notes: null,
      internal_notes: null,
      sales_person_id: leadThan,
      created_by: leadThan,
      approved_by: leadMgr,
      submitted_at: new Date("2026-06-12"),
      approved_at: new Date("2026-06-13"),
      reject_reason: null,
      sent_at: new Date("2026-06-12")
    } as any, { transaction }) as any;

    await QuotationLine.create({
      quotation_id: q2.id,
      product_id: products[1].id,
      quantity: 12,
      unit_price: 28500000,
      tax_rate_id: 1,
      line_total: 28500000 * 12,
      line_tax: 28500000 * 12 * 0.1,
      line_total_after_tax: 28500000 * 12 * 1.1,
      discount_percent: 0,
      discount_amount: 0,
      uom_id: 1
    }, { transaction });

    // Q3 (TGDĐ): accepted, approved
    const q3 = await Quotation.create({
      branch_id: 2,
      quotation_no: "BG-2026-06-0003",
      customer_id: customers[6].id,
      opportunity_id: opportunities[2].id,
      valid_until: "2026-07-20",
      quotation_date: "2026-06-10",
      status: "accepted",
      approval_status: "approved",
      total_before_tax: 9900000 * 20, // 20 Màn hình Dell
      total_tax: 9900000 * 20 * 0.1,
      total_after_tax: 9900000 * 20 * 1.1,
      discount_percent: 0,
      discount_amount: 0,
      version: 1,
      parent_id: null,
      customer_notes: null,
      internal_notes: null,
      sales_person_id: leadSales,
      created_by: leadSales,
      approved_by: leadMgr,
      submitted_at: new Date("2026-06-10"),
      approved_at: new Date("2026-06-10"),
      reject_reason: null,
      sent_at: new Date("2026-06-10")
    } as any, { transaction }) as any;

    await QuotationLine.create({
      quotation_id: q3.id,
      product_id: products[5].id,
      quantity: 20,
      unit_price: 9900000,
      tax_rate_id: 1,
      line_total: 9900000 * 20,
      line_tax: 9900000 * 20 * 0.1,
      line_total_after_tax: 9900000 * 20 * 1.1,
      discount_percent: 0,
      discount_amount: 0,
      uom_id: 1
    }, { transaction });

    // Q4 (Shopee): sent, waiting approval
    const q4 = await Quotation.create({
      branch_id: 2,
      quotation_no: "BG-2026-06-0004",
      customer_id: customers[13].id,
      opportunity_id: opportunities[4].id,
      valid_until: "2026-08-10",
      quotation_date: "2026-06-25",
      status: "sent",
      approval_status: "waiting_approval",
      total_before_tax: 46000000 * 10, // 10 Ghế Aeron
      total_tax: 46000000 * 10 * 0.1,
      total_after_tax: 46000000 * 10 * 1.1,
      discount_percent: 0,
      discount_amount: 0,
      version: 1,
      parent_id: null,
      customer_notes: null,
      internal_notes: null,
      sales_person_id: leadThan,
      created_by: leadThan,
      submitted_at: new Date("2026-06-25")
    } as any, { transaction }) as any;

    await QuotationLine.create({
      quotation_id: q4.id,
      product_id: products[6].id,
      quantity: 10,
      unit_price: 46000000,
      tax_rate_id: 1,
      line_total: 460000000,
      line_tax: 46000000,
      line_total_after_tax: 506000000,
      discount_percent: 0,
      discount_amount: 0,
      uom_id: 1
    }, { transaction });

    // Q5 (Grab): rejected, rejected
    const q5 = await Quotation.create({
      branch_id: 2,
      quotation_no: "BG-2026-06-0005",
      customer_id: customers[14].id,
      opportunity_id: opportunities[5].id,
      valid_until: "2026-06-30",
      quotation_date: "2026-06-20",
      status: "rejected",
      approval_status: "rejected",
      total_before_tax: 30000000 * 5, // 5 iPhone 15
      total_tax: 30000000 * 5 * 0.1,
      total_after_tax: 30000000 * 5 * 1.1,
      discount_percent: 0,
      discount_amount: 0,
      version: 1,
      parent_id: null,
      customer_notes: null,
      internal_notes: null,
      sales_person_id: leadSales,
      created_by: leadSales,
      approved_by: leadMgr,
      submitted_at: new Date("2026-06-20"),
      approved_at: new Date("2026-06-22"),
      reject_reason: "Grab phản hồi không chấp nhận mức báo giá do thiếu chính sách hỗ trợ và kỹ thuật tại chỗ."
    } as any, { transaction }) as any;

    await QuotationLine.create({
      quotation_id: q5.id,
      product_id: products[8].id,
      quantity: 5,
      unit_price: 30000000,
      tax_rate_id: 1,
      line_total: 150000000,
      line_tax: 15000000,
      line_total_after_tax: 165000000,
      discount_percent: 0,
      discount_amount: 0,
      uom_id: 1
    }, { transaction });

    // Seed 5 Sales Orders
    console.log("Seeding Sales Orders...");
    
    // SO 1 (VNG): draft (created by sales)
    const soDraft = await SaleOrder.create({
      branch_id: 2,
      order_no: "SO-2026-06-0001",
      customer_id: customers[0].id,
      order_date: new Date("2026-06-25"),
      status: "draft",
      approval_status: "draft",
      currency_id: 1,
      exchange_rate: 1.0,
      payment_term_id: 3,
      total_before_tax: 25000000 * 2, // 2 Dell XPS
      total_tax: 25000000 * 2 * 0.1,
      total_after_tax: 25000000 * 2 * 1.1,
      created_by: leadSales
    } as any, { transaction }) as any;

    await SaleOrderLine.create({
      order_id: soDraft.id,
      product_id: products[0].id,
      quantity: 2,
      unit_price: 25000000,
      tax_rate_id: 1,
      line_total: 50000000,
      line_tax: 5000000,
      line_total_after_tax: 55000000,
      uom_id: 1
    } as any, { transaction });

    // SO 2 (FPT): confirmed, approved (approved by salesmanager)
    const soConfirmed = await SaleOrder.create({
      branch_id: 2,
      order_no: "SO-2026-06-0002",
      customer_id: customers[1].id,
      order_date: new Date("2026-06-10"),
      status: "confirmed",
      approval_status: "approved",
      currency_id: 1,
      exchange_rate: 1.0,
      payment_term_id: 3,
      total_before_tax: 28500000 * 2, // 2 Macbooks
      total_tax: 28500000 * 2 * 0.1,
      total_after_tax: 28500000 * 2 * 1.1,
      created_by: leadThan,
      approved_by: leadMgr,
      approved_at: new Date("2026-06-11")
    } as any, { transaction }) as any;

    await SaleOrderLine.create({
      order_id: soConfirmed.id,
      product_id: products[1].id,
      quantity: 2,
      unit_price: 28500000,
      tax_rate_id: 1,
      line_total: 57000000,
      line_tax: 5700000,
      line_total_after_tax: 62700000,
      uom_id: 1
    } as any, { transaction });

    // SO 3 (TGDĐ): confirmed, approved, fully invoiced and paid (completed!)
    const soCompleted = await SaleOrder.create({
      branch_id: 2,
      order_no: "SO-2026-06-0003",
      customer_id: customers[6].id,
      order_date: new Date("2026-06-11"),
      status: "completed",
      approval_status: "approved",
      currency_id: 1,
      exchange_rate: 1.0,
      payment_term_id: 3,
      total_before_tax: 9900000 * 20, // 20 Màn hình Dell
      total_tax: 9900000 * 20 * 0.1,
      total_after_tax: 9900000 * 20 * 1.1,
      created_by: leadSales,
      approved_by: leadMgr,
      approved_at: new Date("2026-06-11")
    } as any, { transaction }) as any;

    await SaleOrderLine.create({
      order_id: soCompleted.id,
      product_id: products[5].id,
      quantity: 20,
      unit_price: 9900000,
      tax_rate_id: 1,
      line_total: 198000000,
      line_tax: 19800000,
      line_total_after_tax: 217800000,
      uom_id: 1
    } as any, { transaction });

    // SO 4 (Shopee): waiting_approval (submitted by Than)
    const soWaiting = await SaleOrder.create({
      branch_id: 2,
      order_no: "SO-2026-06-0004",
      customer_id: customers[13].id,
      order_date: new Date("2026-06-26"),
      status: "draft",
      approval_status: "waiting_approval",
      currency_id: 1,
      exchange_rate: 1.0,
      payment_term_id: 3,
      total_before_tax: 46000000 * 5, // 5 Ghế Aeron
      total_tax: 46000000 * 5 * 0.1,
      total_after_tax: 46000000 * 5 * 1.1,
      created_by: leadThan,
      submitted_at: new Date("2026-06-26")
    } as any, { transaction }) as any;

    await SaleOrderLine.create({
      order_id: soWaiting.id,
      product_id: products[6].id,
      quantity: 5,
      unit_price: 46000000,
      tax_rate_id: 1,
      line_total: 230000000,
      line_tax: 23000000,
      line_total_after_tax: 253000000,
      uom_id: 1
    } as any, { transaction });

    // SO 5 (Masan): cancelled
    const soCancelled = await SaleOrder.create({
      branch_id: 2,
      order_no: "SO-2026-06-0005",
      customer_id: customers[8].id,
      order_date: new Date("2026-06-15"),
      status: "cancelled",
      approval_status: "rejected",
      currency_id: 1,
      exchange_rate: 1.0,
      payment_term_id: 3,
      total_before_tax: 7500000 * 2, // 2 Bàn nâng hạ
      total_tax: 7500000 * 2 * 0.1,
      total_after_tax: 7500000 * 2 * 1.1,
      created_by: leadSales,
      reject_reason: "Khách hàng đổi ý mua trực tiếp tại Showroom Phong Vũ."
    } as any, { transaction }) as any;

    await SaleOrderLine.create({
      order_id: soCancelled.id,
      product_id: products[7].id,
      quantity: 2,
      unit_price: 7500000,
      tax_rate_id: 1,
      line_total: 15000000,
      line_tax: 1500000,
      line_total_after_tax: 16500000,
      uom_id: 1
    } as any, { transaction });

    // -------------------------------------------------------------------------
    // 7. Seed Accounts Receivable (AR) Invoices & Receipts
    // -------------------------------------------------------------------------
    console.log("Seeding AR Invoices & Receipts...");
    
    // Invoice 1 (FPT): posted, partially paid
    const arInv1 = await ArInvoice.create({
      branch_id: 2,
      invoice_no: "INV-2026-06-0001",
      order_id: soConfirmed.id,
      invoice_date: new Date("2026-06-11"),
      status: "posted",
      approval_status: "approved",
      total_before_tax: 57000000,
      total_tax: 5700000,
      total_after_tax: 62700000,
      paid_amount: 40000000, // partially paid
      created_by: 11,
      approved_by: 10,
      approved_at: new Date("2026-06-11")
    } as any, { transaction }) as any;

    await ArInvoiceLine.create({
      invoice_id: arInv1.id,
      product_id: products[1].id,
      quantity: 2,
      unit_price: 28500000,
      tax_rate_id: 1,
      line_total: 57000000,
      line_tax: 5700000,
      line_total_after_tax: 62700000
    } as any, { transaction });

    // Invoice 2 (TGDĐ): posted, fully paid
    const arInv2 = await ArInvoice.create({
      branch_id: 2,
      invoice_no: "INV-2026-06-0002",
      order_id: soCompleted.id,
      invoice_date: new Date("2026-06-12"),
      status: "posted",
      approval_status: "approved",
      total_before_tax: 198000000,
      total_tax: 19800000,
      total_after_tax: 217800000,
      paid_amount: 217800000, // fully paid
      created_by: 11,
      approved_by: 10,
      approved_at: new Date("2026-06-12")
    } as any, { transaction }) as any;

    await ArInvoiceLine.create({
      invoice_id: arInv2.id,
      product_id: products[5].id,
      quantity: 20,
      unit_price: 9900000,
      tax_rate_id: 1,
      line_total: 198000000,
      line_tax: 19800000,
      line_total_after_tax: 217800000
    } as any, { transaction });

    // Invoice 3 (Shopee): draft
    const arInv3 = await ArInvoice.create({
      branch_id: 2,
      invoice_no: "INV-2026-06-0003",
      order_id: soWaiting.id,
      invoice_date: new Date("2026-06-27"),
      status: "draft",
      approval_status: "draft",
      total_before_tax: 230000000,
      total_tax: 23000000,
      total_after_tax: 253000000,
      paid_amount: 0,
      created_by: 11
    } as any, { transaction }) as any;

    await ArInvoiceLine.create({
      invoice_id: arInv3.id,
      product_id: products[6].id,
      quantity: 5,
      unit_price: 46000000,
      tax_rate_id: 1,
      line_total: 230000000,
      line_tax: 23000000,
      line_total_after_tax: 253000000
    } as any, { transaction });

    // Invoice 4 (Masan): posted, unpaid
    const arInv4 = await ArInvoice.create({
      branch_id: 2,
      invoice_no: "INV-2026-06-0004",
      customer_id: customers[8].id, // direct invoice without order
      invoice_date: new Date("2026-06-16"),
      status: "posted",
      approval_status: "approved",
      total_before_tax: 15000000,
      total_tax: 1500000,
      total_after_tax: 16500000,
      paid_amount: 0,
      created_by: 11,
      approved_by: 10,
      approved_at: new Date("2026-06-16")
    } as any, { transaction }) as any;

    await ArInvoiceLine.create({
      invoice_id: arInv4.id,
      product_id: products[7].id,
      quantity: 2,
      unit_price: 7500000,
      tax_rate_id: 1,
      line_total: 15000000,
      line_tax: 1500000,
      line_total_after_tax: 16500000
    } as any, { transaction });

    // Receipts
    // Receipt 1 (FPT): posted, bank transfer, applied to Invoice 1
    const arRec1 = await ArReceipt.create({
      branch_id: 2,
      receipt_no: "REC-2026-06-0001",
      customer_id: customers[1].id,
      receipt_date: new Date("2026-06-15"),
      amount: 40000000,
      status: "posted",
      approval_status: "approved",
      method: "bank",
      allocation_status: "fully_allocated",
      created_by: 11,
      approved_by: 10,
      approved_at: new Date("2026-06-15")
    } as any, { transaction }) as any;

    await ArReceiptAllocation.create({
      receipt_id: arRec1.id,
      invoice_id: arInv1.id,
      applied_amount: 40000000
    } as any, { transaction });

    // Receipt 2 (TGDĐ): posted, bank transfer, applied to Invoice 2
    const arRec2 = await ArReceipt.create({
      branch_id: 2,
      receipt_no: "REC-2026-06-0002",
      customer_id: customers[6].id,
      receipt_date: new Date("2026-06-16"),
      amount: 217800000,
      status: "posted",
      approval_status: "approved",
      method: "bank",
      allocation_status: "fully_allocated",
      created_by: 11,
      approved_by: 10,
      approved_at: new Date("2026-06-16")
    } as any, { transaction }) as any;

    await ArReceiptAllocation.create({
      receipt_id: arRec2.id,
      invoice_id: arInv2.id,
      applied_amount: 217800000
    } as any, { transaction });

    // Receipt 3 (Masan): draft
    await ArReceipt.create({
      branch_id: 2,
      receipt_no: "REC-2026-06-0003",
      customer_id: customers[8].id,
      receipt_date: new Date("2026-06-20"),
      amount: 15000000,
      status: "draft",
      approval_status: "draft",
      method: "cash",
      allocation_status: "unallocated",
      created_by: 11
    } as any, { transaction });

    // -------------------------------------------------------------------------
    // 8. Seed Purchase RFQs, POs, Invoices, Payments
    // -------------------------------------------------------------------------
    console.log("Seeding Purchases (RFQs, POs, AP Invoices, Payments)...");
    
    // RFQ 1 (Phong Vũ): accepted, approved
    const rfq1 = await PurchaseRfq.create({
      branch_id: 2,
      rfq_no: "RFQ-2026-06-0001",
      supplier_id: suppliers[0].id,
      rfq_date: "2026-06-01",
      status: "accepted",
      approval_status: "approved",
      total_before_tax: 18000000 * 10, // 10 Dell laptops
      total_tax: 18000000 * 10 * 0.1,
      total_after_tax: 18000000 * 10 * 1.1,
      created_by: 14
    } as any, { transaction }) as any;

    await PurchaseRfqLine.create({
      rfq_id: rfq1.id,
      product_id: products[0].id,
      quantity: 10,
      unit_price: 18000000,
      tax_rate_id: 1,
      line_total: 180000000,
      line_tax: 18000000,
      line_total_after_tax: 198000000,
      uom_id: 1
    } as any, { transaction });

    // RFQ 2 (Digiworld): accepted, approved
    const rfq2 = await PurchaseRfq.create({
      branch_id: 2,
      rfq_no: "RFQ-2026-06-0002",
      supplier_id: suppliers[1].id,
      rfq_date: "2026-06-02",
      status: "accepted",
      approval_status: "approved",
      total_before_tax: 21000000 * 15, // 15 Macbooks
      total_tax: 21000000 * 15 * 0.1,
      total_after_tax: 21000000 * 15 * 1.1,
      created_by: 14
    } as any, { transaction }) as any;

    await PurchaseRfqLine.create({
      rfq_id: rfq2.id,
      product_id: products[1].id,
      quantity: 15,
      unit_price: 21000000,
      tax_rate_id: 1,
      line_total: 21000000 * 15,
      line_tax: 21000000 * 15 * 0.1,
      line_total_after_tax: 21000000 * 15 * 1.1,
      uom_id: 1
    } as any, { transaction });

    // RFQ 3 (FPT Synnex): sent, waiting approval
    const rfq3 = await PurchaseRfq.create({
      branch_id: 2,
      rfq_no: "RFQ-2026-06-0003",
      supplier_id: suppliers[2].id,
      rfq_date: "2026-06-20",
      status: "sent",
      approval_status: "waiting_approval",
      total_before_tax: 24000000 * 8, // 8 iPhones
      total_tax: 24000000 * 8 * 0.1,
      total_after_tax: 24000000 * 8 * 1.1,
      created_by: 14
    } as any, { transaction }) as any;

    await PurchaseRfqLine.create({
      rfq_id: rfq3.id,
      product_id: products[8].id,
      quantity: 8,
      unit_price: 24000000,
      tax_rate_id: 1,
      line_total: 192000000,
      line_tax: 19200000,
      line_total_after_tax: 211200000,
      uom_id: 1
    } as any, { transaction });

    // PO 1 (Phong Vũ): confirmed, approved
    const poConfirmed1 = await PurchaseOrder.create({
      branch_id: 2,
      po_no: "PO-2026-06-0001",
      supplier_id: suppliers[0].id,
      rfq_id: rfq1.id,
      order_date: new Date("2026-06-02"),
      status: "confirmed",
      total_before_tax: 180000000,
      total_tax: 18000000,
      total_after_tax: 198000000,
      created_by: 14,
      approved_by: 13,
      approved_at: new Date("2026-06-02")
    } as any, { transaction }) as any;

    await PurchaseOrderLine.create({
      po_id: poConfirmed1.id,
      product_id: products[0].id,
      quantity: 10,
      unit_price: 18000000,
      tax_rate_id: 1,
      line_total: 180000000,
      line_tax: 18000000,
      line_total_after_tax: 198000000,
      uom_id: 1
    } as any, { transaction });

    // PO 2 (Digiworld): confirmed, approved, completed
    const poCompleted2 = await PurchaseOrder.create({
      branch_id: 2,
      po_no: "PO-2026-06-0002",
      supplier_id: suppliers[1].id,
      rfq_id: rfq2.id,
      order_date: new Date("2026-06-03"),
      status: "completed",
      total_before_tax: 315000000,
      total_tax: 31500000,
      total_after_tax: 346500000,
      created_by: 14,
      approved_by: 13,
      approved_at: new Date("2026-06-03")
    } as any, { transaction }) as any;

    await PurchaseOrderLine.create({
      po_id: poCompleted2.id,
      product_id: products[1].id,
      quantity: 15,
      unit_price: 21000000,
      tax_rate_id: 1,
      line_total: 315000000,
      line_tax: 31500000,
      line_total_after_tax: 346500000,
      uom_id: 1
    } as any, { transaction });

    // PO 3 (FPT Synnex): waiting_approval (submitted by purchase staff)
    const poWaiting3 = await PurchaseOrder.create({
      branch_id: 2,
      po_no: "PO-2026-06-0003",
      supplier_id: suppliers[2].id,
      rfq_id: rfq3.id,
      order_date: new Date("2026-06-21"),
      status: "draft",
      approval_status: "waiting_approval",
      total_before_tax: 192000000,
      total_tax: 19200000,
      total_after_tax: 211200000,
      created_by: 14,
      submitted_at: new Date("2026-06-21")
    } as any, { transaction }) as any;

    await PurchaseOrderLine.create({
      po_id: poWaiting3.id,
      product_id: products[8].id,
      quantity: 8,
      unit_price: 24000000,
      tax_rate_id: 1,
      line_total: 192000000,
      line_tax: 19200000,
      line_total_after_tax: 211200000,
      uom_id: 1
    } as any, { transaction });

    // PO 4 (PSD): draft
    const poDraft4 = await PurchaseOrder.create({
      branch_id: 2,
      po_no: "PO-2026-06-0004",
      supplier_id: suppliers[3].id,
      order_date: new Date("2026-06-25"),
      status: "draft",
      approval_status: "draft",
      total_before_tax: 17000000 * 3, // 3 iPads
      total_tax: 17000000 * 3 * 0.1,
      total_after_tax: 17000000 * 3 * 1.1,
      created_by: 14
    } as any, { transaction }) as any;

    await PurchaseOrderLine.create({
      po_id: poDraft4.id,
      product_id: products[9].id,
      quantity: 3,
      unit_price: 17000000,
      tax_rate_id: 1,
      line_total: 51000000,
      line_tax: 5100000,
      line_total_after_tax: 56100000,
      uom_id: 1
    } as any, { transaction });

    // PO 5 (Vĩnh Xuân): cancelled
    const poCancelled5 = await PurchaseOrder.create({
      branch_id: 2,
      po_no: "PO-2026-06-0005",
      supplier_id: suppliers[5].id,
      order_date: new Date("2026-06-15"),
      status: "cancelled",
      approval_status: "rejected",
      total_before_tax: 11500000 * 5, // 5 CPUs
      total_tax: 11500000 * 5 * 0.1,
      total_after_tax: 11500000 * 5 * 1.1,
      created_by: 14,
      reject_reason: "Hủy bỏ đơn đặt hàng vì nhà cung cấp báo hết hàng dòng CPU i9-14900K."
    } as any, { transaction }) as any;

    await PurchaseOrderLine.create({
      po_id: poCancelled5.id,
      product_id: products[11].id,
      quantity: 5,
      unit_price: 11500000,
      tax_rate_id: 1,
      line_total: 57500000,
      line_tax: 5750000,
      line_total_after_tax: 63250000,
      uom_id: 1
    } as any, { transaction });

    // AP Invoices
    console.log("Seeding AP Invoices...");
    
    // AP Invoice 1 (Phong Vũ): posted, fully paid
    const apInv1 = await ApInvoice.create({
      branch_id: 2,
      invoice_no: "APINV-2026-06-0001",
      po_id: poConfirmed1.id,
      supplier_id: suppliers[0].id,
      invoice_date: new Date("2026-06-05"),
      status: "posted",
      approval_status: "approved",
      total_before_tax: 180000000,
      total_tax: 18000000,
      total_after_tax: 198000000,
      paid_amount: 198000000, // fully paid
      created_by: 11
    } as any, { transaction }) as any;

    await ApInvoiceLine.create({
      ap_invoice_id: apInv1.id,
      product_id: products[0].id,
      quantity: 10,
      unit_price: 18000000,
      tax_rate_id: 1,
      line_total: 180000000,
      line_tax: 18000000,
      line_total_after_tax: 198000000
    } as any, { transaction });

    // AP Invoice 2 (Digiworld): posted, partially paid
    const apInv2 = await ApInvoice.create({
      branch_id: 2,
      invoice_no: "APINV-2026-06-0002",
      po_id: poCompleted2.id,
      supplier_id: suppliers[1].id,
      invoice_date: new Date("2026-06-06"),
      status: "posted",
      approval_status: "approved",
      total_before_tax: 315000000,
      total_tax: 31500000,
      total_after_tax: 346500000,
      paid_amount: 100000000, // partially paid
      created_by: 11
    } as any, { transaction }) as any;

    await ApInvoiceLine.create({
      ap_invoice_id: apInv2.id,
      product_id: products[1].id,
      quantity: 15,
      unit_price: 21000000,
      tax_rate_id: 1,
      line_total: 315000000,
      line_tax: 31500000,
      line_total_after_tax: 346500000
    } as any, { transaction });

    // AP Invoice 3 (FPT Synnex): draft
    const apInv3 = await ApInvoice.create({
      branch_id: 2,
      invoice_no: "APINV-2026-06-0003",
      po_id: poWaiting3.id,
      supplier_id: suppliers[2].id,
      invoice_date: new Date("2026-06-25"),
      status: "draft",
      approval_status: "draft",
      total_before_tax: 192000000,
      total_tax: 19200000,
      total_after_tax: 211200000,
      paid_amount: 0,
      created_by: 11
    } as any, { transaction }) as any;

    await ApInvoiceLine.create({
      ap_invoice_id: apInv3.id,
      product_id: products[8].id,
      quantity: 8,
      unit_price: 24000000,
      tax_rate_id: 1,
      line_total: 192000000,
      line_tax: 19200000,
      line_total_after_tax: 211200000
    } as any, { transaction });

    // AP Invoice 4 (PSD): posted, unpaid (direct invoice)
    const apInv4 = await ApInvoice.create({
      branch_id: 2,
      invoice_no: "APINV-2026-06-0004",
      supplier_id: suppliers[3].id,
      invoice_date: new Date("2026-06-26"),
      status: "posted",
      approval_status: "approved",
      total_before_tax: 51000000,
      total_tax: 5100000,
      total_after_tax: 56100000,
      paid_amount: 0,
      created_by: 11
    } as any, { transaction }) as any;

    await ApInvoiceLine.create({
      ap_invoice_id: apInv4.id,
      product_id: products[9].id,
      quantity: 3,
      unit_price: 17000000,
      tax_rate_id: 1,
      line_total: 51000000,
      line_tax: 5100000,
      line_total_after_tax: 56100000
    } as any, { transaction });

    // AP Payments
    console.log("Seeding AP Payments...");
    
    // Payment 1 (Phong Vũ): fully paid AP Invoice 1
    await ApPayment.create({
      branch_id: 2,
      payment_no: "PAY-2026-06-0001",
      supplier_id: suppliers[0].id,
      payment_date: new Date("2026-06-10"),
      amount: 198000000,
      status: "posted",
      approval_status: "approved",
      method: "bank",
      allocation_status: "fully_allocated",
      created_by: 11
    } as any, { transaction });

    // Payment 2 (Digiworld): partially paid AP Invoice 2
    await ApPayment.create({
      branch_id: 2,
      payment_no: "PAY-2026-06-0002",
      supplier_id: suppliers[1].id,
      payment_date: new Date("2026-06-12"),
      amount: 100000000,
      status: "posted",
      approval_status: "approved",
      method: "bank",
      allocation_status: "fully_allocated",
      created_by: 11
    } as any, { transaction });

    // -------------------------------------------------------------------------
    // 9. Seed Inventory Stock Movements (Receipts, Issues, Transfers)
    // -------------------------------------------------------------------------
    console.log("Seeding Stock Movements...");
    const userWhStaff = 9;
    const userWhMgr = 8;

    // Stock Move 1: Receipt from PO 2 (Digiworld, completed) to HCM warehouse
    const move1 = await StockMove.create({
      branch_id: 2,
      move_no: "SM-REC-2026-06-0001",
      move_date: new Date("2026-06-04"),
      type: "receipt",
      warehouse_to_id: whHcm.id,
      reference_type: "purchase_order",
      reference_id: poCompleted2.id,
      status: "posted",
      created_by: userWhStaff,
      approved_by: userWhMgr,
      approved_at: new Date("2026-06-04")
    } as any, { transaction }) as any;

    await StockMoveLine.create({
      move_id: move1.id,
      product_id: products[1].id,
      quantity: 15,
      uom_id: 1,
      location_to_id: locHcm.id
    }, { transaction });

    // Stock Move 2: Issue for SO 3 (TGDĐ, completed) from HCM warehouse
    const move2 = await StockMove.create({
      branch_id: 2,
      move_no: "SM-ISS-2026-06-0001",
      move_date: new Date("2026-06-12"),
      type: "issue",
      warehouse_from_id: whHcm.id,
      reference_type: "sale_order",
      reference_id: soCompleted.id,
      status: "posted",
      created_by: userWhStaff,
      approved_by: userWhMgr,
      approved_at: new Date("2026-06-12")
    } as any, { transaction }) as any;

    await StockMoveLine.create({
      move_id: move2.id,
      product_id: products[5].id,
      quantity: 20,
      uom_id: 1,
      location_from_id: locHcm.id
    }, { transaction });

    // Stock Move 3: Internal Transfer from HCM to HN warehouse (in_transit)
    const move3 = await StockMove.create({
      branch_id: 2,
      move_no: "SM-TRF-2026-06-0001",
      move_date: new Date("2026-06-25"),
      type: "transfer",
      warehouse_from_id: whHcm.id,
      warehouse_to_id: whHn.id,
      reference_type: "transfer",
      status: "in_transit",
      created_by: userWhStaff
    } as any, { transaction }) as any;

    await StockMoveLine.create({
      move_id: move3.id,
      product_id: products[3].id, // 5 Keychrons
      quantity: 5,
      uom_id: 1,
      location_from_id: locHcm.id,
      location_to_id: locHn.id
    }, { transaction });

    // Stock Move 4: Scrap adjustment (posted)
    const move4 = await StockMove.create({
      branch_id: 2,
      move_no: "SM-ADJ-2026-06-0001",
      move_date: new Date("2026-06-18"),
      type: "scrap",
      warehouse_from_id: whHcm.id,
      reference_type: "adjustment",
      status: "posted",
      created_by: userWhStaff,
      approved_by: userWhMgr,
      approved_at: new Date("2026-06-18")
    } as any, { transaction }) as any;

    await StockMoveLine.create({
      move_id: move4.id,
      product_id: products[19].id, // 1 broken pen box
      quantity: 1,
      uom_id: 1,
      location_from_id: locHcm.id
    }, { transaction });

    // Stock Move 5: Receipt from PO 1 (Phong Vũ) to HN warehouse (waiting_approval)
    const move5 = await StockMove.create({
      branch_id: 3,
      move_no: "SM-REC-2026-06-0002",
      move_date: new Date("2026-06-27"),
      type: "receipt",
      warehouse_to_id: whHn.id,
      reference_type: "purchase_order",
      reference_id: poConfirmed1.id,
      status: "waiting_approval",
      created_by: 9 // whstaff
    } as any, { transaction }) as any;

    await StockMoveLine.create({
      move_id: move5.id,
      product_id: products[0].id, // 10 laptops
      quantity: 10,
      uom_id: 1,
      location_to_id: locHn.id
    }, { transaction });

    // -------------------------------------------------------------------------
    // 10. Seed HRM (Departments, Positions, 8 Employees, 3 Months Attendances, 3 Periods Payrolls)
    // -------------------------------------------------------------------------
    console.log("Seeding HRM module (8 Employees, 3 Months Attendances)...");
    const deptHr = await Department.create({ branch_id: 2, code: "HR", name: "Hành chính Nhân sự" }, { transaction }) as any;
    const deptSales = await Department.create({ branch_id: 2, code: "SALES", name: "Phòng Kinh doanh" }, { transaction }) as any;
    const deptTech = await Department.create({ branch_id: 2, code: "TECH", name: "Phòng Kỹ thuật" }, { transaction }) as any;
    const deptAcc = await Department.create({ branch_id: 2, code: "ACC", name: "Phòng Tài chính Kế toán" }, { transaction }) as any;

    const posManager = await Position.create({ branch_id: 2, name: "Trưởng phòng" }, { transaction }) as any;
    const posStaff = await Position.create({ branch_id: 2, name: "Nhân viên" }, { transaction }) as any;

    const employeesData = [
      { branch_id: 2, emp_code: "EMP-MINHP-001", full_name: "Nguyễn Thị Lan", gender: "female", contract_type: "official", department_id: deptHr.id, position_id: posManager.id, base_salary: 25000000, bank_account: "1012384792", bank_name: "Vietcombank", status: "active" },
      { branch_id: 2, emp_code: "EMP-MINHP-002", full_name: "Lê Văn Nam", gender: "male", contract_type: "official", department_id: deptSales.id, position_id: posManager.id, base_salary: 22000000, bank_account: "1028749301", bank_name: "Techcombank", status: "active" },
      { branch_id: 2, emp_code: "EMP-MINHP-003", full_name: "Phạm Hoàng Long", gender: "male", contract_type: "official", department_id: deptTech.id, position_id: posStaff.id, base_salary: 30000000, bank_account: "1902847930", bank_name: "BIDV", status: "active" },
      { branch_id: 2, emp_code: "EMP-MINHP-004", full_name: "Trần Minh Tuấn", gender: "male" as const, contract_type: "trial" as const, department_id: deptSales.id, position_id: posStaff.id, base_salary: 12000000, bank_account: "2029384791", bank_name: "MB Bank", status: "active" as const },
      { branch_id: 2, emp_code: "EMP-MINHP-005", full_name: "Vũ Thu Thủy", gender: "female" as const, contract_type: "trial" as const, department_id: deptHr.id, position_id: posStaff.id, base_salary: 10000000, bank_account: "3028374920", bank_name: "ACB", status: "active" as const },
      { branch_id: 2, emp_code: "EMP-MINHP-006", full_name: "Hoàng Văn Đức", gender: "male" as const, contract_type: "official" as const, department_id: deptTech.id, position_id: posManager.id, base_salary: 18000000, bank_account: "4028374921", bank_name: "Vietinbank", status: "active" as const },
      { branch_id: 3, emp_code: "EMP-MINHP-007", full_name: "Ngô Quốc Anh", gender: "male" as const, contract_type: "official" as const, department_id: deptTech.id, position_id: posStaff.id, base_salary: 11000000, bank_account: "5028374922", bank_name: "Agribank", status: "active" as const },
      { branch_id: 2, emp_code: "EMP-MINHP-008", full_name: "Đỗ Thùy Linh", gender: "female" as const, contract_type: "official" as const, department_id: deptAcc.id, position_id: posStaff.id, base_salary: 15000000, bank_account: "6028374923", bank_name: "TP Bank", status: "active" as const }
    ];

    const employees: Employee[] = [];
    for (const e of employeesData) {
      const emp = await Employee.create(e as any, { transaction });
      employees.push(emp);
    }

    // Seed Attendances for 3 Months: April, May, June 2026
    console.log("Generating over 500 attendance records for 3 months (April - June)...");
    
    // Define working days logic
    const buildAttendances = async (year: number, month: number) => {
      let count = 0;
      const daysInMonth = new Date(year, month, 0).getDate();
      for (const emp of employees) {
        for (let day = 1; day <= daysInMonth; day++) {
          const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const date = new Date(dateStr);
          const dayOfWeek = date.getDay(); // 0 is Sunday, 6 is Saturday
          if (dayOfWeek !== 0 && dayOfWeek !== 6) {
            const checkIn = new Date(`${dateStr}T08:00:00.000Z`);
            const checkOut = new Date(`${dateStr}T17:00:00.000Z`);
            await Attendance.create({
              branch_id: emp.branch_id || 2,
              employee_id: emp.id,
              work_date: date,
              check_in: checkIn,
              check_out: checkOut,
              working_hours: 8,
              status: "present",
              note: "Chấm công tự động"
            } as any, { transaction });
            count++;
          }
        }
      }
      return count;
    };

    const aprCount = await buildAttendances(2026, 4); // April 2026 (22 working days)
    const mayCount = await buildAttendances(2026, 5); // May 2026 (21 working days)
    const junCount = await buildAttendances(2026, 6); // June 2026 (22 working days)
    console.log(`Total attendance records generated: ${aprCount + mayCount + junCount}`);

    // Seed Payroll Periods
    // 1. April 2026 (closed)
    const periodApr = await PayrollPeriod.create({
      branch_id: 2,
      period_code: "PRD-2026-04",
      start_date: new Date("2026-04-01"),
      end_date: new Date("2026-04-30"),
      status: "closed"
    }, { transaction }) as any;

    // 2. May 2026 (closed)
    const periodMay = await PayrollPeriod.create({
      branch_id: 2,
      period_code: "PRD-2026-05",
      start_date: new Date("2026-05-01"),
      end_date: new Date("2026-05-31"),
      status: "closed"
    }, { transaction }) as any;

    // 3. June 2026 (open)
    const periodJun = await PayrollPeriod.create({
      branch_id: 2,
      period_code: "PRD-2026-06",
      start_date: new Date("2026-06-01"),
      end_date: new Date("2026-06-30"),
      status: "open"
    }, { transaction }) as any;

    // Payroll Runs
    console.log("Seeding Payroll Runs & Lines...");
    
    // Run 1: April 2026 (posted, approved)
    const runApr = await PayrollRun.create({
      period_id: periodApr.id,
      run_no: "RUN-MINHP-2026-04-01",
      status: "posted",
      approval_status: "approved",
      submitted_at: new Date("2026-05-01"),
      approved_by: 4, // CEO
      approved_at: new Date("2026-05-02")
    } as any, { transaction }) as any;

    for (const emp of employees) {
      const dailyRate = Math.round(Number(emp.base_salary || 0) / 22);
      const grossAmount = Number(emp.base_salary || 0);
      await PayrollRunLine.create({
        run_id: runApr.id,
        employee_id: emp.id,
        amount: grossAmount,
        present_days: 22,
        absent_days: 0,
        leave_days: 0,
        late_days: 0,
        base_salary: emp.base_salary,
        daily_rate: dailyRate,
        gross_amount: grossAmount,
        total_earning: grossAmount,
        total_deduction: 0,
        pit_amount: 0,
        net_amount: grossAmount
      } as any, { transaction });
    }

    // Run 2: May 2026 (posted, approved)
    const runMay = await PayrollRun.create({
      period_id: periodMay.id,
      run_no: "RUN-MINHP-2026-05-01",
      status: "posted",
      approval_status: "approved",
      submitted_at: new Date("2026-06-01"),
      approved_by: 4, // CEO
      approved_at: new Date("2026-06-02")
    } as any, { transaction }) as any;

    for (const emp of employees) {
      const dailyRate = Math.round(Number(emp.base_salary || 0) / 21);
      const grossAmount = Number(emp.base_salary || 0);
      await PayrollRunLine.create({
        run_id: runMay.id,
        employee_id: emp.id,
        amount: grossAmount,
        present_days: 21,
        absent_days: 0,
        leave_days: 0,
        late_days: 0,
        base_salary: emp.base_salary,
        daily_rate: dailyRate,
        gross_amount: grossAmount,
        total_earning: grossAmount,
        total_deduction: 0,
        pit_amount: 0,
        net_amount: grossAmount
      } as any, { transaction });
    }

    // Run 3: June 2026 (draft)
    const runJun = await PayrollRun.create({
      period_id: periodJun.id,
      run_no: "RUN-MINHP-2026-06-01",
      status: "draft",
      approval_status: "draft"
    } as any, { transaction }) as any;

    for (const emp of employees) {
      const dailyRate = Math.round(Number(emp.base_salary || 0) / 22);
      const grossAmount = Number(emp.base_salary || 0);
      await PayrollRunLine.create({
        run_id: runJun.id,
        employee_id: emp.id,
        amount: grossAmount,
        present_days: 22,
        absent_days: 0,
        leave_days: 0,
        late_days: 0,
        base_salary: emp.base_salary,
        daily_rate: dailyRate,
        gross_amount: grossAmount,
        total_earning: grossAmount,
        total_deduction: 0,
        pit_amount: 0,
        net_amount: grossAmount
      } as any, { transaction });
    }

    // -------------------------------------------------------------------------
    // 11. Seed Financial Accounting (GL Entries & Lines)
    // -------------------------------------------------------------------------
    console.log("Seeding Financial Accounting...");
    
    // 1. Sales GL Entry 1 (VNG invoice)
    const glSale1 = await GlEntry.create({
      branch_id: 2,
      entry_no: "GL-2026-06-0001",
      entry_date: new Date("2026-06-11"),
      journal_id: 1, // SALES
      memo: "Hạch toán doanh thu hóa đơn bán hàng INV-2026-06-0001",
      reference_type: "ar_invoice",
      reference_id: arInv1.id,
      status: "posted",
      created_by: 11
    } as any, { transaction }) as any;

    await GlEntryLine.create({ entry_id: glSale1.id, account_id: 5, debit: 62700000, credit: 0 }, { transaction }); // 131
    await GlEntryLine.create({ entry_id: glSale1.id, account_id: 27, debit: 0, credit: 57000000 }, { transaction }); // 511
    await GlEntryLine.create({ entry_id: glSale1.id, account_id: 2, debit: 0, credit: 5700000 }, { transaction }); // Cash/VAT fallback

    // 2. Sales GL Entry 2 (TGDĐ invoice)
    const glSale2 = await GlEntry.create({
      branch_id: 2,
      entry_no: "GL-2026-06-0002",
      entry_date: new Date("2026-06-12"),
      journal_id: 1, // SALES
      memo: "Hạch toán doanh thu hóa đơn bán hàng INV-2026-06-0002",
      reference_type: "ar_invoice",
      reference_id: arInv2.id,
      status: "posted",
      created_by: 11
    } as any, { transaction }) as any;

    await GlEntryLine.create({ entry_id: glSale2.id, account_id: 5, debit: 217800000, credit: 0 }, { transaction }); // 131
    await GlEntryLine.create({ entry_id: glSale2.id, account_id: 27, debit: 0, credit: 198000000 }, { transaction }); // 511
    await GlEntryLine.create({ entry_id: glSale2.id, account_id: 2, debit: 0, credit: 19800000 }, { transaction }); // Cash/VAT fallback

    // 3. Purchase GL Entry 1 (Phong Vũ invoice)
    const glPurchase1 = await GlEntry.create({
      branch_id: 2,
      entry_no: "GL-2026-06-0003",
      entry_date: new Date("2026-06-05"),
      journal_id: 2, // PURCHASE
      memo: "Hạch toán mua hàng hóa đơn APINV-2026-06-0001",
      reference_type: "ap_invoice",
      reference_id: apInv1.id,
      status: "posted",
      created_by: 11
    } as any, { transaction }) as any;

    await GlEntryLine.create({ entry_id: glPurchase1.id, account_id: 12, debit: 180000000, credit: 0 }, { transaction }); // 156
    await GlEntryLine.create({ entry_id: glPurchase1.id, account_id: 2, debit: 18000000, credit: 0 }, { transaction });
    await GlEntryLine.create({ entry_id: glPurchase1.id, account_id: 15, debit: 0, credit: 198000000 }, { transaction }); // 331

    // 4. Purchase GL Entry 2 (Digiworld invoice)
    const glPurchase2 = await GlEntry.create({
      branch_id: 2,
      entry_no: "GL-2026-06-0004",
      entry_date: new Date("2026-06-06"),
      journal_id: 2, // PURCHASE
      memo: "Hạch toán mua hàng hóa đơn APINV-2026-06-0002",
      reference_type: "ap_invoice",
      reference_id: apInv2.id,
      status: "posted",
      created_by: 11
    } as any, { transaction }) as any;

    await GlEntryLine.create({ entry_id: glPurchase2.id, account_id: 12, debit: 315000000, credit: 0 }, { transaction }); // 156
    await GlEntryLine.create({ entry_id: glPurchase2.id, account_id: 2, debit: 31500000, credit: 0 }, { transaction });
    await GlEntryLine.create({ entry_id: glPurchase2.id, account_id: 15, debit: 0, credit: 346500000 }, { transaction }); // 331

    await sequelize.query("SET FOREIGN_KEY_CHECKS = 1;", { transaction });
    await transaction.commit();
    console.log("✅ Seeding completed successfully!");
    process.exit(0);
  } catch (err) {
    await transaction.rollback();
    console.error("❌ Seeding failed:", err);
    process.exit(1);
  }
})();
