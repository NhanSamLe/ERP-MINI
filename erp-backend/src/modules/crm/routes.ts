import { Router } from "express";
import { authMiddleware } from "../../core/middleware/auth";
import * as leadController from "./controllers/lead.controller";
import * as opportunityController from "./controllers/opportunity.controller";
import * as activityController from "./controllers/activity.controller";
const router = Router();

router.get("/leads", authMiddleware([]), leadController.getLeads);
router.get("/leads/stage/:stage", authMiddleware([]), leadController.getLeadByStage);
router.get("/leads/:leadId", authMiddleware([]), leadController.getLeadById);
router.post("/leads", authMiddleware([]), leadController.createLead);

router.patch("/leads/:leadId", authMiddleware([]), leadController.updateLeadBasic);
router.patch("/leads/:leadId/evaluation", authMiddleware([]), leadController.updateLeadEvaluation);
router.post("/leads/:leadId/convert", authMiddleware([]), leadController.convertToCustomer);
router.patch("/leads/:leadId/lost", authMiddleware([]), leadController.markAsLost);
router.patch("/leads/:leadId/reassign", authMiddleware([]), leadController.reassignLead);
router.patch("/leads/:leadId/reopen", authMiddleware([]), leadController.reopenLead);
router.delete("/leads/:leadId", authMiddleware([]), leadController.deleteLead);
router.get("/leads/today", authMiddleware([]), leadController.getTodayLead);

// Opportunity Routes
// router.get("/opportunities/my", authMiddleware([]), opportunityController.getMyOpportunities);
// router.get("/opportunities", authMiddleware([]), opportunityController.getAllOpportunities);
router.get("/opportunities", authMiddleware([]), opportunityController.getOpportunities);
router.get("/opportunities/:oppId", authMiddleware([]), opportunityController.getOpportunityById);
router.post("/opportunities", authMiddleware([]), opportunityController.createOpportunity);
router.patch("/opportunities/:oppId", authMiddleware([]), opportunityController.updateOpportunity);
router.patch("/opportunities/:oppId/negotiation", authMiddleware([]), opportunityController.moveToNegotiation);
router.patch("/opportunities/:oppId/won", authMiddleware([]), opportunityController.markWon);
router.patch("/opportunities/:oppId/lost", authMiddleware([]), opportunityController.markLost);
router.patch("/opportunities/:oppId/reassign", authMiddleware([]), opportunityController.reassignOpportunity);
router.get("/opportunities/pipeline-summary", authMiddleware([]), opportunityController.getPipelineSummary);
router.delete("/opportunities/:oppId", authMiddleware([]), opportunityController.deleteOpportunity);
router.get("/opportunities/closing-this-month", authMiddleware([]),opportunityController.getClosingThisMonth);
router.get("/opportunities/unclosed",authMiddleware([]),opportunityController.getUnclosedOpportunities);



// // Activity Routes
// // ---- CREATE ----
// router.post("/activities/call",     authMiddleware([]), activityController.createCallActivity);
// router.post("/activities/email",    authMiddleware([]), activityController.createEmailActivity);
// router.post("/activities/meeting",  authMiddleware([]), activityController.createMeetingActivity);
// router.post("/activities/task",     authMiddleware([]), activityController.createTaskActivity);

// // ---- UPDATE COMMON ----
// router.put("/activities/:id", authMiddleware([]), activityController.updateActivity);

// // ---- UPDATE DETAIL ----
// router.put("/activities/call/:id",    authMiddleware([]), activityController.updateCallDetail);
// router.put("/activities/email/:id",   authMiddleware([]), activityController.updateEmailDetail);
// router.put("/activities/meeting/:id", authMiddleware([]), activityController.updateMeetingDetail);

// // ---- TASK STATUS ----
// router.patch("/activities/task/start/:id",    authMiddleware([]), activityController.startTask);
// router.patch("/activities/task/complete/:id", authMiddleware([]), activityController.completeTask);

// // ---- COMPLETE ACTIVITY (general) ----
// router.patch("/activities/complete/:id", authMiddleware([]), activityController.completeActivity);

// // ---- REASSIGN ----
// router.patch("/activities/reassign/:id", authMiddleware([]), activityController.reassignActivity);

// // ---- DETAIL ----
// router.get("/activities/call/:id",    authMiddleware([]), activityController.getCallActivityDetail);
// router.get("/activities/email/:id",   authMiddleware([]), activityController.getEmailActivityDetail);
// router.get("/activities/meeting/:id", authMiddleware([]), activityController.getMeetingActivityDetail);
// router.get("/activities/task/:id",    authMiddleware([]), activityController.getTaskActivityDetail);

// // ---- LIST ----
// router.get("/activities",        authMiddleware([]), activityController.getAllActivities);
// router.get("/activities/my",     authMiddleware([]), activityController.getMyActivities);
// router.get("/activities/today",  authMiddleware([]), activityController.getTodayActivities);

// // ---- LIST BY ENTITY ----
// router.get("/activities/for/:type/:id", authMiddleware([]), activityController.getActivitiesFor);
// router.get("/activities/timeline/:type/:id", authMiddleware([]), activityController.getTimeline);

// // ---- DELETE ----
// router.delete("/activities/:id", authMiddleware([]), activityController.deleteActivity);



// // ---- CREATE (Priority: Specific types first) ----
router.post("/activities/call", authMiddleware([]), activityController.createCallActivity);
router.post("/activities/email", authMiddleware([]), activityController.createEmailActivity);
router.post("/activities/meeting", authMiddleware([]), activityController.createMeetingActivity);
router.post("/activities/task", authMiddleware([]), activityController.createTaskActivity);

// ---- LIST (Priority: Specific paths before :id params) ----
router.get("/activities/my", authMiddleware([]), activityController.getMyActivities);
router.get("/activities/today", authMiddleware([]), activityController.getTodayActivities);
router.get("/activities/for/:type/:id", authMiddleware([]), activityController.getActivitiesFor);
router.get("/activities/timeline/:type/:id", authMiddleware([]), activityController.getTimeline);

// ---- DETAIL by type (Priority: Before generic :id) ----
router.get("/activities/:id", authMiddleware([]), activityController.getActivityDetail);


// ---- UPDATE DETAIL by type ----
router.put("/activities/call/:id", authMiddleware([]), activityController.updateCallDetail);
router.put("/activities/email/:id", authMiddleware([]), activityController.updateEmailDetail);
router.put("/activities/meeting/:id", authMiddleware([]), activityController.updateMeetingDetail);
router.put("/activities/task/:id", authMiddleware([]), activityController.updateTaskDetail);

// ---- TASK STATUS ----
router.patch("/activities/task/start/:id", authMiddleware([]), activityController.startTask);
router.patch("/activities/task/complete/:id", authMiddleware([]), activityController.completeTask);

// ---- REASSIGN & COMPLETE (Priority: Before generic :id) ----
router.patch("/activities/reassign/:id", authMiddleware([]), activityController.reassignActivity);

// ---- UPDATE COMMON (Generic :id routes last) ----
router.put("/activities/:id", authMiddleware([]), activityController.updateActivity);

// ---- GENERIC GET ALL ----
router.get("/activities", authMiddleware([]), activityController.getAllActivities);

// ---- DELETE ----
router.delete("/activities/:id", authMiddleware([]), activityController.deleteActivity);


router.post("/activities/meeting/cancel",authMiddleware([]), activityController.cancelMeeting);
router.post("/activities/call/cancel", authMiddleware([]), activityController.cancelCallActivity);
router.post("/activities/email/cancel", authMiddleware([]), activityController.cancelEmailActivity);

router.post("/activities/meeting/complete", authMiddleware([]), activityController.completeMeeting);
router.post("/activities/email/send", authMiddleware([]), activityController.sendEmailForActivity);

export default router;