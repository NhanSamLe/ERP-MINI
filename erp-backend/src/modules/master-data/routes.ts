import { Router } from "express";
import * as currencyController from "./controllers/currencyExchange.controller";
import { authMiddleware } from "../../core/middleware/auth";
import * as taxController from "./controllers/tax.controller";
import * as uomController from "./controllers/uom.controller";
import * as UomConversionController from "./controllers/uomConversion.controller";
const router = Router();

// Danh sách tiền tệ trong DB
router.get("/currencies", authMiddleware([]),currencyController.getCurrencies);

// Danh sách mã tiền thực tế (API ngoài)
router.get("/currencies/real", currencyController.getRealCurrencies);

//  Thêm loại tiền mới
router.post("/currencies",authMiddleware(["ADMIN"]), currencyController.addCurrency);

// Cập nhật tỷ giá
router.post("/currencies/rates/update",authMiddleware([]), currencyController.updateExchangeRates);

//  Lấy tỷ giá mới nhất
router.get("/currencies/rates",authMiddleware([]), currencyController.getExchangeRates);

// Lấy danh sách + search + filter
router.get("/taxes", taxController.getAllTaxRates);

// Lấy danh sách + search + filter
router.get("/taxes/search", taxController.searchTaxRates);

// Lấy thuế đang hoạt động          
router.get("/taxs/active", taxController.getActiveTaxRates);   

// Lấy chi tiết 1 loại thuế theo ID
router.get("/taxes/:id", taxController.getTaxById);       

 // Thêm thuế mới
router.post("/taxes", taxController.createTaxRate);   

 // Cập nhật thông tin thuế
router.put("/taxes/:id", taxController.updateTaxRate);       

// Xóa (hoặc chuyển inactive)
router.delete("/taxes/:id", taxController.deleteTaxRate);     

// 📌 UOM Conversion CRUD
router.get("/uoms/conversions", UomConversionController.getAllConversions);
router.get("/uoms/conversions/search", UomConversionController.searchConversions);
router.post("/uoms/conversions", UomConversionController.createConversion);
router.put("/uoms/conversions/:id", UomConversionController.updateConversion);
router.delete("/uoms/conversions/:id", UomConversionController.deleteConversion);

router.get("/uoms", uomController.getAllUoms);
router.get("/uoms/search", uomController.searchUoms);
router.get("/uoms/:id", uomController.getUomById);
router.post("/uoms", uomController.createUom);
router.put("/uoms/:id", uomController.updateUom);
router.delete("/uoms/:id", uomController.deleteUom);


export default router;