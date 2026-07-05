import { Router } from "express";
import * as glJournalController from "../controllers/glJournal.controller";
import { authMiddleware } from "../../../core/middleware/auth";

// nếu bạn có middleware auth thì import vào: import authMiddleware from "../../../middlewares/auth";

const router = Router();

router.get("/", authMiddleware(["ACCOUNT", "CHACC", "ADMIN", "CEO", "BRANCH_MANAGER"]), glJournalController.getAll);
router.get("/journals", authMiddleware(["ACCOUNT", "CHACC", "ADMIN", "CEO"]), glJournalController.listJournals);
router.get("/journals/:journalId/entries", authMiddleware(["ACCOUNT", "CHACC", "ADMIN", "CEO"]), glJournalController.listEntriesByJournal);
router.get("/entries/:id", authMiddleware(["ACCOUNT", "CHACC", "ADMIN", "CEO"]), glJournalController.getEntryDetail);
router.post("/entries", authMiddleware(["ACCOUNT", "CHACC", "ADMIN"]), glJournalController.createManualEntry);
router.put("/entries/:id/status", authMiddleware(["CHACC", "ADMIN"]), glJournalController.updateEntryStatus);
router.get("/reports/trial-balance", authMiddleware(["ACCOUNT", "CHACC", "ADMIN", "CEO"]), glJournalController.getTrialBalance);
router.get("/reports/profit-loss", authMiddleware(["ACCOUNT", "CHACC", "ADMIN", "CEO"]), glJournalController.getProfitLoss);

export default router;
