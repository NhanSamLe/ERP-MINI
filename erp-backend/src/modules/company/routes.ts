import { Router } from "express";
import * as branchController from "./controllers/branch.controller";
import { authMiddleware } from "../../core/middleware/auth";
import { Role } from "../../core/types/enum";

const router = Router();

// Chi nhánh là dữ liệu nhạy cảm (mã số thuế, tài khoản ngân hàng) — chỉ CEO/ADMIN quản lý.
const branchRoles = authMiddleware([]);

router.get("/",  branchRoles, branchController.getAllBranches);
router.get("/:id", branchRoles, branchController.getBranch);
router.post("/", branchRoles, branchController.createBranch);
router.put("/:id", branchRoles, branchController.updateBranch);
router.patch("/:id/deactivate", branchRoles, branchController.deactivateBranch);
router.patch("/:id/activate",   branchRoles, branchController.activateBranch);
// (tuỳ chọn) xóa cứng: sẽ chặn khi còn dữ liệu liên quan
router.delete("/:id", branchRoles, branchController.deleteBranch);


export default router;
