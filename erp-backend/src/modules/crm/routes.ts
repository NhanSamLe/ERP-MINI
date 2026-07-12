import { Router } from "express";
import { authMiddleware } from "../../core/middleware/auth";
import { Role } from "../../core/types/enum";
import * as leadController from "./controllers/lead.controller";
import * as opportunityController from "./controllers/opportunity.controller";
import * as activityController from "./controllers/activity.controller";
import * as leadSourceController from "./controllers/leadSource.controller";
import * as pipelineController from "./controllers/pipeline.controller";
import * as scoringRuleController from "./controllers/scoringRule.controller";
import { getSalesDashboard } from "./controllers/dashboard.controller"
import multer from "multer";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

const crmRoles = authMiddleware([Role.SALES, Role.SALESMANAGER, Role.CEO]);

router.get("/leads", crmRoles, leadController.getLeads);
router.post("/leads/bulk", crmRoles, leadController.bulkCreateLeads);
router.post("/leads/import", crmRoles, upload.single("file"), leadController.importLeads);
router.get("/leads/today", crmRoles, leadController.getTodayLead);
router.get("/leads/stage/:stage", crmRoles, leadController.getLeadByStage);
router.get("/leads/:leadId", crmRoles, leadController.getLeadById);
router.post("/leads", crmRoles, leadController.createLead);

router.patch("/leads/:leadId", crmRoles, leadController.updateLeadBasic);
router.patch("/leads/:leadId/evaluation", crmRoles, leadController.updateLeadEvaluation);
router.post("/leads/:leadId/convert", crmRoles, leadController.convertToCustomer);
router.patch("/leads/:leadId/lost", crmRoles, leadController.markAsLost);
router.patch("/leads/:leadId/reassign", crmRoles, leadController.reassignLead);
router.patch("/leads/:leadId/reopen", crmRoles, leadController.reopenLead);
router.delete("/leads/:leadId", crmRoles, leadController.deleteLead);

// Opportunity Routes
// router.get("/opportunities/my", crmRoles, opportunityController.getMyOpportunities);
// router.get("/opportunities", crmRoles, opportunityController.getAllOpportunities);
router.get("/opportunities", crmRoles, opportunityController.getOpportunities);
router.get("/opportunities/pipeline-summary", crmRoles, opportunityController.getPipelineSummary);
router.get("/opportunities/closing-this-month", crmRoles, opportunityController.getClosingThisMonth);
router.get("/opportunities/unclosed", crmRoles, opportunityController.getUnclosedOpportunities);
router.get("/opportunities/:oppId", crmRoles, opportunityController.getOpportunityById);
router.post("/opportunities", crmRoles, opportunityController.createOpportunity);
router.patch("/opportunities/:oppId", crmRoles, opportunityController.updateOpportunity);
router.post("/opportunities/:oppId/negotiation", crmRoles, opportunityController.moveToNegotiation);
router.patch("/opportunities/:oppId/stage", crmRoles, opportunityController.changePipelineStage);
router.patch("/opportunities/:oppId/won", crmRoles, opportunityController.markWon);
router.patch("/opportunities/:oppId/lost", crmRoles, opportunityController.markLost);
router.patch("/opportunities/:oppId/reassign", crmRoles, opportunityController.reassignOpportunity);
router.delete("/opportunities/:oppId", crmRoles, opportunityController.deleteOpportunity);



// // ---- CREATE (Priority: Specific types first) ----
router.post("/activities/call", crmRoles, activityController.createCallActivity);
router.post("/activities/email", crmRoles, activityController.createEmailActivity);
router.post("/activities/meeting", crmRoles, activityController.createMeetingActivity);
router.post("/activities/task", crmRoles, activityController.createTaskActivity);

// ---- LIST (Priority: Specific paths before :id params) ----
router.get("/activities/my", crmRoles, activityController.getMyActivities);
router.get("/activities/today", crmRoles, activityController.getTodayActivities);
router.get("/activities/for/:type/:id", crmRoles, activityController.getActivitiesFor);
router.get("/activities/timeline/:type/:id", crmRoles, activityController.getTimeline);

// ---- DETAIL by type (Priority: Before generic :id) ----
router.get("/activities/:id", crmRoles, activityController.getActivityDetail);


// ---- UPDATE DETAIL by type ----
router.put("/activities/call/:id", crmRoles, activityController.updateCallDetail);
router.put("/activities/email/:id", crmRoles, activityController.updateEmailDetail);
router.put("/activities/meeting/:id", crmRoles, activityController.updateMeetingDetail);
router.put("/activities/task/:id", crmRoles, activityController.updateTaskDetail);

// ---- TASK STATUS ----
router.patch("/activities/task/start/:id", crmRoles, activityController.startTask);
router.patch("/activities/task/complete/:id", crmRoles, activityController.completeTask);

// ---- REASSIGN & COMPLETE (Priority: Before generic :id) ----
router.patch("/activities/reassign/:id", crmRoles, activityController.reassignActivity);

// ---- UPDATE COMMON (Generic :id routes last) ----
router.put("/activities/:id", crmRoles, activityController.updateActivity);

// ---- GENERIC GET ALL ----
router.get("/activities", crmRoles, activityController.getAllActivities);

// ---- DELETE ----
router.delete("/activities/:id", crmRoles, activityController.deleteActivity);


router.post("/activities/meeting/cancel", crmRoles, activityController.cancelMeeting);
router.post("/activities/call/cancel", crmRoles, activityController.cancelCallActivity);
router.post("/activities/email/cancel", crmRoles, activityController.cancelEmailActivity);

router.post("/activities/meeting/complete", crmRoles, activityController.completeMeeting);
router.post("/activities/email/send", crmRoles, activityController.sendEmailForActivity);
router.post("/activities/email/send-with-attachments", crmRoles, upload.array("attachments", 10), activityController.sendEmailWithAttachments);

router.get("/dashboard/sales", crmRoles, getSalesDashboard);

// =====================
// PHASE 2: NEW CRM ROUTES
// =====================

// Lead Sources
router.get("/lead-sources", crmRoles, leadSourceController.getAll);
router.post("/lead-sources", crmRoles, leadSourceController.create);
router.put("/lead-sources/:id", crmRoles, leadSourceController.update);
router.delete("/lead-sources/:id", crmRoles, leadSourceController.remove);

// Pipelines & Stages
router.get("/pipelines", crmRoles, pipelineController.getAllPipelines);
router.post("/pipelines", crmRoles, pipelineController.createPipeline);
router.put("/pipelines/:id", crmRoles, pipelineController.updatePipeline);

router.post("/pipelines/:id/stages", crmRoles, pipelineController.addStage);
router.put("/pipelines/stages/:stageId", crmRoles, pipelineController.updateStage);
router.delete("/pipelines/stages/:stageId", crmRoles, pipelineController.deleteStage);

// Scoring Rules
router.get("/scoring-rules/signals", crmRoles, scoringRuleController.getSignals);
router.post("/scoring-rules/preview", crmRoles, scoringRuleController.previewRule);
router.get("/scoring-rules", crmRoles, scoringRuleController.getAll);
router.post("/scoring-rules", crmRoles, scoringRuleController.create);
router.put("/scoring-rules/:id", crmRoles, scoringRuleController.update);
router.delete("/scoring-rules/:id", crmRoles, scoringRuleController.remove);

// Auto-recalculate individual Lead Score
router.post("/leads/:leadId/recalculate-score", crmRoles, scoringRuleController.recalculateLead);

export default router;
