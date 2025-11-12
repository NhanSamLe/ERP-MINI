import { Router } from "express";
import * as branchController from "./controllers/branch.controller";
import { authMiddleware } from "../../core/middleware/auth";

const router = Router();

router.get("/",  branchController.getAllBranches);
router.get("/:id", branchController.getBranch);
router.post("/", branchController.createBranch);
router.put("/:id", branchController.updateBranch);
router.patch("/:id/deactivate", branchController.deactivateBranch);
router.patch("/:id/activate",   branchController.activateBranch);
// (tuỳ chọn) xóa cứng: sẽ chặn khi còn dữ liệu liên quan
router.delete("/:id", branchController.deleteBranch);


export default router;
