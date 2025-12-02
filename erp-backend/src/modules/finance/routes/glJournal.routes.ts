import { Router } from "express";
import * as glJournalController from "../controllers/glJournal.controller";
// nếu bạn có middleware auth thì import vào: import authMiddleware from "../../../middlewares/auth";

const router = Router();

// chỉ cho view, không cho CRUD
router.get("/", /* authMiddleware, */ glJournalController.getAll);

export default router;
