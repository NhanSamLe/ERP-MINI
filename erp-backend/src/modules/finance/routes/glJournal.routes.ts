import { Router } from "express";
import * as glJournalController from "../controllers/glJournal.controller";
import { authMiddleware } from "../../../core/middleware/auth";

// nếu bạn có middleware auth thì import vào: import authMiddleware from "../../../middlewares/auth";

const router = Router();

// chỉ cho view, không cho CRUD
router.get("/", /* authMiddleware, */ glJournalController.getAll);
router.get("/journals", authMiddleware(["ACCOUNT", "CEO"]), glJournalController.listJournals);
router.get("/journals/:journalId/entries", authMiddleware(["ACCOUNT", "CEO"]), glJournalController.listEntriesByJournal);
router.get("/entries/:id", authMiddleware(["ACCOUNT", "CEO"]), glJournalController.getEntryDetail);

export default router;
