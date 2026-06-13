import { Router } from "express";
import * as currencyController from "./controllers/currencyExchange.controller";
import { authMiddleware } from "../../core/middleware/auth";
import * as taxController from "./controllers/tax.controller";
import * as uomController from "./controllers/uom.controller";
import * as UomConversionController from "./controllers/uomConversion.controller";
import * as paymentTermController from "./controllers/paymentTerm.controller";
const router = Router();

// Danh sách tiền tệ trong DB
router.get("/currencies", authMiddleware([]),currencyController.getCurrencies);

// Danh sách mã tiền thực tế (API ngoài)
router.get("/currencies/real", authMiddleware([]), currencyController.getRealCurrencies);

//  Thêm loại tiền mới
router.post("/currencies",authMiddleware(["ADMIN"]), currencyController.addCurrency);

// Cập nhật tỷ giá
router.post("/currencies/rates/update",authMiddleware([]), currencyController.updateExchangeRates);

//  Lấy tỷ giá mới nhất
router.get("/currencies/rates",authMiddleware([]), currencyController.getExchangeRates);

// Lấy danh sách + search + filter
router.get("/taxes",authMiddleware([]), taxController.getAllTaxRates);

// Lấy danh sách + search + filter
router.get("/taxes/search", authMiddleware([]), taxController.searchTaxRates);

// Lấy thuế đang hoạt động          
router.get("/taxs/active", authMiddleware([]), taxController.getActiveTaxRates);   

// Lấy chi tiết 1 loại thuế theo ID
router.get("/taxes/:id", authMiddleware([]), taxController.getTaxById);       

 // Thêm thuế mới
router.post("/taxes", authMiddleware([]), taxController.createTaxRate);   

 // Cập nhật thông tin thuế
router.put("/taxes/:id", authMiddleware([]), taxController.updateTaxRate);       

// Xóa (hoặc chuyển inactive)
router.delete("/taxes/:id", authMiddleware([]), taxController.deleteTaxRate);     

// 📌 UOM Conversion CRUD
router.get("/uoms/conversions", authMiddleware([]), UomConversionController.getAllConversions);
router.get("/uoms/conversions/search", authMiddleware([]), UomConversionController.searchConversions);
router.post("/uoms/conversions", authMiddleware([]), UomConversionController.createConversion);
router.put("/uoms/conversions/:id", authMiddleware([]), UomConversionController.updateConversion);
router.delete("/uoms/conversions/:id", authMiddleware([]), UomConversionController.deleteConversion);

router.get("/uoms", authMiddleware([]), uomController.getAllUoms);
router.get("/uoms/search", authMiddleware([]), uomController.searchUoms);
router.get("/uoms/:id", authMiddleware([]), uomController.getUomById);
router.post("/uoms", authMiddleware([]), uomController.createUom);
router.put("/uoms/:id", authMiddleware([]), uomController.updateUom);
router.delete("/uoms/:id", authMiddleware([]), uomController.deleteUom);

// Payment Terms
router.get("/payment-terms/active", authMiddleware([]), paymentTermController.getActivePaymentTerms);
router.get("/payment-terms", authMiddleware([]), paymentTermController.getAllPaymentTerms);
router.get("/payment-terms/:id", authMiddleware([]), paymentTermController.getPaymentTermById);
router.post("/payment-terms", authMiddleware([]), paymentTermController.createPaymentTerm);
router.put("/payment-terms/:id", authMiddleware([]), paymentTermController.updatePaymentTerm);
router.delete("/payment-terms/:id", authMiddleware([]), paymentTermController.deletePaymentTerm);

export default router;