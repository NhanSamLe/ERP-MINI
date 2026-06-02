import { Router } from "express";
import { authMiddleware } from "../../../core/middleware/auth";
import { SalesReturnController } from "../controllers/salesReturn.controller";

const router = Router();

router.get("/rmas", authMiddleware([]), SalesReturnController.getRmas);
router.post("/rmas", authMiddleware([]), SalesReturnController.createRma);
router.get("/rmas/:id", authMiddleware([]), SalesReturnController.getRma);
router.post("/rmas/:id/submit", authMiddleware([]), SalesReturnController.submitRma);
router.post("/rmas/:id/approve", authMiddleware([]), SalesReturnController.approveRma);
router.post("/rmas/:id/reject", authMiddleware([]), SalesReturnController.rejectRma);
router.get("/rmas/:id/return", authMiddleware([]), SalesReturnController.getReturnByRmaId);
router.post("/rmas/:id/create-return", authMiddleware([]), SalesReturnController.createReturnFromRma);

router.get("/returns", authMiddleware([]), SalesReturnController.getReturns);
router.get("/returns/:id", authMiddleware([]), SalesReturnController.getReturn);
router.post("/returns/:id/inspect", authMiddleware([]), SalesReturnController.inspectReturn);
router.post("/returns/:id/complete", authMiddleware([]), SalesReturnController.completeReturn);
router.post("/returns/:id/create-credit-note", authMiddleware([]), SalesReturnController.createCreditNote);

router.get("/credit-notes", authMiddleware([]), SalesReturnController.getCreditNotes);
router.get("/credit-notes/:id", authMiddleware([]), SalesReturnController.getCreditNote);
router.post("/credit-notes/:id/approve", authMiddleware([]), SalesReturnController.approveCreditNote);
router.post("/credit-notes/:id/create-refund", authMiddleware([]), SalesReturnController.createRefund);

router.get("/refunds", authMiddleware([]), SalesReturnController.getRefunds);
router.get("/refunds/:id", authMiddleware([]), SalesReturnController.getRefund);
router.post("/refunds/:id/approve", authMiddleware([]), SalesReturnController.approveRefund);

export default router;
