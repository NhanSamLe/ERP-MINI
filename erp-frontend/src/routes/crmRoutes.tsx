import { RouteObject } from "react-router-dom";
import ProtectedRoute from "../components/ProtectedRoute";
import CrmDashboard from "../features/crm/CrmDashboard";
// import CRMSaleWorkSpace from "../features/crm/page/crmSalesWorkspacePage";
// import CallActivityCreatePage from "../features/crm/page/CallActivityCreatePage"
// import CallAllActivityDashboard from "../features/crm/page/callActivityDashboard";
import LeadDashboard from "../features/crm/page/LeadDashboard";
import LeadCreatePage from "../features/crm/page/LeadCreatePage";
import LeadDetailPage from "../features/crm/page/LeadDetailPage";
import OpportunityBoardPage from "../features/crm/page/OpportunityBoardPage";
import MeetingCreatePage from "../features/crm/page/MeetingCreatePage";
import MeetingDetailPage from "../features/crm/page/MeetingDetailPage";
import MeetingListPage from "../features/crm/page/MeetingListPage";
import MeetingUpdatePage from "../features/crm/page/MeetingUpdatePage";
import TaskCreatePage from "../features/crm/page/TaskCreatePage";
import TaskDetailPage from "../features/crm/page/TaskDetailPage";
import TaskKanbanPage from "../features/crm/page/TaskListPage";
import TaskUpdatePage from "../features/crm/page/TaskUpdatePage";
import EmailListPage from "../features/crm/page/EmailListPage";
import EmailCreatePage from "../features/crm/page/EmailCreatePage";
import EmailUpdatePage from "../features/crm/page/EmailUpdatePage";
import EmailDetailPage from "../features/crm/page/EmailDetailPage";
import CallCreatePage from "../features/crm/page/CallCreatePage";
import CallDetailPage from "../features/crm/page/CallDetailPage";
import CallListPage from "../features/crm/page/CallListPage";
import CallUpdatePage from "../features/crm/page/CallUpdatePage";
import OppDetailPage from "../features/crm/page/OppDetailPage";
import OpportunityCreatePage from "../features/crm/page/OpportunityCreatePage";
import OpportunityUpdatePage from "../features/crm/page/OpportunityUpdatePage";
const crmRoutes: RouteObject[] = [
  {
    path: "/crm",
    element: (
      <ProtectedRoute allowedRoles={["CEO", "SALESMANAGER"]}>
        <CrmDashboard />
      </ProtectedRoute>
    ),
  },
  {
    path: "/crm/leads",
    element: (
      <ProtectedRoute allowedRoles={["CEO", "SALESMANAGER","SALES"]}>
        <LeadDashboard />
      </ProtectedRoute>
    ),
  },
  {
    path: "/crm/opportunities",
    element: (
      <ProtectedRoute allowedRoles={["CEO", "SALESMANAGER","SALES"]}>
        <OpportunityBoardPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/crm/opportunities/:id",
    element: (
      <ProtectedRoute allowedRoles={["CEO", "SALESMANAGER","SALES"]}>
        <OppDetailPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/crm/opportunities/create",
    element: (
      <ProtectedRoute allowedRoles={["CEO", "SALESMANAGER","SALES"]}>
        <OpportunityCreatePage/>
      </ProtectedRoute>
    ),
  },
  {
    path: "/crm/opportunities/:id/edit",
    element: (
      <ProtectedRoute allowedRoles={["CEO", "SALESMANAGER","SALES"]}>
        <OpportunityUpdatePage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/crm/lead/create",
    element: (
      <ProtectedRoute allowedRoles={["CEO", "SALESMANAGER","SALES"]}>
        <LeadCreatePage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/crm/leads/:id",
    element: (
      <ProtectedRoute allowedRoles={["CEO", "SALESMANAGER","SALES"]}>
        <LeadDetailPage />
      </ProtectedRoute>
    ),
  },
  // {
  //   path: "/crm/sale-workspace",
  //   element: (
  //     <ProtectedRoute allowedRoles={["SALES", "SALESMANAGER", "ADMIN"]}>
  //       <CRMSaleWorkSpace />
  //     </ProtectedRoute>
  //   ),
  // },

  

  {
    path: "/crm/activities/meetings",
    element: (
      <ProtectedRoute allowedRoles={["SALES", "SALESMANAGER", "ADMIN"]}>
        <MeetingListPage/>
      </ProtectedRoute>
    ),
  },
  {
    path: "/crm/activities/meeting/create",
    element: (
      <ProtectedRoute allowedRoles={["SALES", "SALESMANAGER", "ADMIN"]}>
        <MeetingCreatePage/>
      </ProtectedRoute>
    ),
  },
  {
    path: "/crm/activities/meeting/:id",
    element: (
      <ProtectedRoute allowedRoles={["SALES", "SALESMANAGER", "ADMIN"]}>
        <MeetingDetailPage/>
      </ProtectedRoute>
    ),
  },
   {
    path: "/crm/activities/meeting/:id/edit",
    element: (
      <ProtectedRoute allowedRoles={["SALES", "SALESMANAGER", "ADMIN"]}>
        <MeetingUpdatePage/>
      </ProtectedRoute>
    ),
  },
  {
    path: "/crm/activities/tasks",
    element: (
      <ProtectedRoute allowedRoles={["SALES", "SALESMANAGER", "ADMIN"]}>
        <TaskKanbanPage/>
      </ProtectedRoute>
    ),
  },
  {
    path: "/crm/activities/task/create",
    element: (
      <ProtectedRoute allowedRoles={["SALES", "SALESMANAGER", "ADMIN"]}>
        <TaskCreatePage/>
      </ProtectedRoute>
    ),
  },
  {
    path: "/crm/activities/task/:id",
    element: (
      <ProtectedRoute allowedRoles={["SALES", "SALESMANAGER", "ADMIN"]}>
        <TaskDetailPage/>
      </ProtectedRoute>
    ),
  },
   {
    path: "/crm/activities/task/:id/edit",
    element: (
      <ProtectedRoute allowedRoles={["SALES", "SALESMANAGER", "ADMIN"]}>
        <TaskUpdatePage/>
      </ProtectedRoute>
    ),
  },
  {
    path: "/crm/activities/emails",
    element: (
      <ProtectedRoute allowedRoles={["SALES", "SALESMANAGER", "ADMIN"]}>
        <EmailListPage/>
      </ProtectedRoute>
    ),
  },
  {
    path: "/crm/activities/email/create",
    element: (
      <ProtectedRoute allowedRoles={["SALES", "SALESMANAGER", "ADMIN"]}>
        <EmailCreatePage/>
      </ProtectedRoute>
    ),
  },
  {
    path: "/crm/activities/email/:id",
    element: (
      <ProtectedRoute allowedRoles={["SALES", "SALESMANAGER", "ADMIN"]}>
        <EmailDetailPage/>
      </ProtectedRoute>
    ),
  },
   {
    path: "/crm/activities/email/:id/edit",
    element: (
      <ProtectedRoute allowedRoles={["SALES", "SALESMANAGER", "ADMIN"]}>
        <EmailUpdatePage/>
      </ProtectedRoute>
    ),
  },

   {
    path: "/crm/activities/calls",
    element: (
      <ProtectedRoute allowedRoles={["SALES", "SALESMANAGER", "ADMIN"]}>
        <CallListPage/>
      </ProtectedRoute>
    ),
  },
  {
    path: "/crm/activities/call/create",
    element: (
      <ProtectedRoute allowedRoles={["SALES", "SALESMANAGER", "ADMIN"]}>
        <CallCreatePage/>
      </ProtectedRoute>
    ),
  },
  {
    path: "/crm/activities/call/:id",
    element: (
      <ProtectedRoute allowedRoles={["SALES", "SALESMANAGER", "ADMIN"]}>
        <CallDetailPage/>
      </ProtectedRoute>
    ),
  },
   {
    path: "/crm/activities/call/:id/edit",
    element: (
      <ProtectedRoute allowedRoles={["SALES", "SALESMANAGER", "ADMIN"]}>
        <CallUpdatePage/>
      </ProtectedRoute>
    ),
  },
];

export default crmRoutes;
