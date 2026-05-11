import { Router } from "express";
import { authMiddleware } from "../../../core/middleware/auth";

import {
  createLeave,
  submitLeave,
  cancelLeave,
  pendingLeaves,
  approveLeave,
  rejectLeave,
  allocateLeave,
  listAllocations,
} from "../controllers/leave.controller";

const router = Router();

router.post("/request", authMiddleware([]), createLeave);
router.put("/:id/submit", authMiddleware([]), submitLeave);
router.put("/:id/cancel", authMiddleware([]), cancelLeave);

router.get(
  "/pending",
  authMiddleware(["HR_STAFF", "HR_MANAGER"]),
  pendingLeaves
);

router.put(
  "/:id/approve",
  authMiddleware(["HR_STAFF", "HR_MANAGER"]),
  approveLeave
);

router.put(
  "/:id/reject",
  authMiddleware(["HR_STAFF", "HR_MANAGER"]),
  rejectLeave
);

router.post(
  "/allocations",
  authMiddleware(["HR_STAFF", "HR_MANAGER"]),
  allocateLeave
);

router.get(
  "/allocations",
  authMiddleware(["HR_STAFF", "HR_MANAGER"]),
  listAllocations
);

export default router;