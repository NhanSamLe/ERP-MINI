# CRM Sales Frontend Context And Gap Analysis

File này là context tập trung cho module CRM + Sales frontend của ERP-MINI. Đọc file này trước khi sửa các flow Lead, Opportunity, Quotation, Sale Order, AR Invoice, AR Receipt.

Ngày ghi nhận: 2026-05-17.

## Backend Business Flow Expected

Flow nghiệp vụ backend hiện có:

1. Lead được tạo trong CRM.
2. Sales chăm sóc lead bằng activity, update basic/evaluation, scoring.
3. Lead có thể convert thành Partner customer hoặc mark lost/reopen/reassign.
4. Opportunity được tạo từ lead hoặc customer.
5. Opportunity đi qua pipeline/stage, có thể mark won/lost/reassign/delete.
6. Quotation được tạo cho customer và có thể gắn opportunity.
7. Quotation draft -> submit -> approve -> customer accepted.
8. Accepted quotation convert thành Sale Order.
9. Sale Order draft -> submit -> approve/reject.
10. Sale Order approval tạo StockMove issue chờ kho duyệt.
11. Sale Order approved tạo AR Invoice.
12. AR Invoice approval post GL.
13. AR Receipt thu tiền, approval post GL, allocation cập nhật trạng thái invoice.

Module bị tác động:

- CRM tác động Partner khi convert lead hoặc mark opportunity won.
- Sales Quotation/Sale Order dùng Partner, Product, TaxRate, PriceList, Currency, PaymentTerm.
- Sale Order approval tác động Inventory bằng StockMove issue.
- Sale Order/Quotation có loopback về Opportunity.
- AR Invoice/Receipt tác động Finance/GL.

## Frontend Route Access

CRM routes:

- `/crm`, dashboard: `SALES`, `SALESMANAGER`, `ADMIN`.
- `/crm/leads`, `/crm/lead/create`, `/crm/leads/:id`: `CEO`, `SALESMANAGER`, `SALES`.
- `/crm/opportunities`, detail/create/edit: `CEO`, `SALESMANAGER`, `SALES`.
- CRM activities call/email/meeting/task: `SALES`, `SALESMANAGER`, `ADMIN`.
- CRM settings lead sources/pipelines/scoring rules: `SALESMANAGER`, `ADMIN`.

Sales routes:

- `/sales/quotations`: `SALES`, `SALESMANAGER`, `ADMIN`.
- `/sales/quotations/create` and edit: `SALES`, `SALESMANAGER`.
- `/sales/quotations/:id`: `SALES`, `SALESMANAGER`, `ADMIN`, `ACCOUNT`, `CEO`.
- `/sales`: `SALES`, `SALESMANAGER`.
- `/sales/orders`: `SALES`, `SALESMANAGER`, `ACCOUNT`, `WHSTAFF`, `CEO`.
- `/sales/orders/create`: `SALES`, `SALESMANAGER`.
- `/sales/orders/:id/edit`: `SALES`.
- `/sales/orders/:id`: `SALES`, `SALESMANAGER`, `BRANCH_MANAGER`, `CEO`, `ADMIN`, `ACCOUNT`, `CHACC`, `WHSTAFF`.
- `/invoices`, `/invoices/:id`: `SALES`, `SALESMANAGER`, `ACCOUNT`, `CHACC`.
- `/receipts`: `SALES`, `SALESMANAGER`, `ACCOUNT`, `CHACC`.
- `/receipts/create`, `/receipts/:id`: `ACCOUNT`, `CHACC`.

Note: `BRANCH_MANAGER` appears in frontend Sales route but backend enum currently uses `CEO`, `SALESMANAGER`, `SALES`, `WHMANAGER`, `WHSTAFF`, `CHACC`, `ACCOUNT`, `HRMANAGER`, `PURCHASE`, `PURCHASEMANAGER`, `ADMIN`.

## CRM Frontend Flow

### Lead List

Page: `erp-frontend/src/features/crm/page/LeadDashboard.tsx`

What it does:

- Dispatches `fetchAllLeads()` and `fetchTodayLeads()`.
- Allows navigation to create and detail.
- Supports delete through `ActionConfirmModal`.
- Refreshes all/today leads after actions.

Backend alignment:

- `GET /crm/leads` returns all leads for `SALESMANAGER`, my leads for others.
- `GET /crm/leads/today` similarly filters by role in backend.

Issues:

- Route allows `CEO`, but backend `getLeads` only treats `SALESMANAGER` as manager; `CEO` receives only own leads.
- `ADMIN` not allowed in lead route although backend can manage in service-level checks.

### Lead Create

Page: `erp-frontend/src/features/crm/page/LeadCreatePage.tsx`

What it does:

- Dispatches `createLead(form)`.
- Navigates to `/crm/leads/:id` after create.
- Uses discard confirm modal.

Backend alignment:

- Backend create ignores some DTO fields: controller currently takes only `name`, `email`, `phone`, `source`; `source_id`, `industry`, `company_size` from FE DTO are not passed through.

### Lead Detail

Page: `erp-frontend/src/features/crm/page/LeadDetailPage.tsx`

What it does:

- Loads lead detail, all leads, activities and timeline.
- Allows update basic info.
- Allows update evaluation.
- Allows convert lead.
- Allows mark lost, reopen, delete.
- Shows related opportunities.
- Uses `ActionConfirmModal` for destructive/important actions.

Important mismatch:

- FE action says convert lead then navigates to `/crm/opportunities`.
- Backend `convertToCustomer` only converts Lead to Partner customer and marks lead qualified. It does not create Opportunity.
- Redux `convertLead.fulfilled` expects action payload to be updated lead, but backend returns `{ lead, customer }`; state update uses `updated.id`, which is undefined.

Bug:

- FE reassign API sends `PATCH /crm/leads/:leadId/reassign` with body `{ newUserId }`.
- Backend controller reads `{ leadId, newUserId }` from body, not params.
- Result: reassign lead is broken unless FE includes `leadId` in body or backend uses `req.params.leadId`.

### Opportunity Board

Page: `erp-frontend/src/features/crm/page/OpportunityBoardPage.tsx`

What it does:

- Dispatches `fetchAllOpportunities()`.
- Displays pipeline board by configured pipeline stages.
- Allows drag-and-drop stage change via `changePipelineStage`.
- Has create opportunity navigation.

Backend alignment:

- `changePipelineStage` endpoint exists as `PATCH /crm/opportunities/:oppId/stage`.
- After drag/drop, FE refetches opportunities.

Issues:

- Board allows stage movement for everyone who can access route: `CEO`, `SALESMANAGER`, `SALES`. Backend service enforces owner or manager/admin via `canManage`.
- `CEO` route access may pass UI but backend service may reject edits because `canManage` only treats `SALESMANAGER` and `ADMIN` as manager.

### Opportunity Detail

Page: `erp-frontend/src/features/crm/page/OppDetailPage.tsx`

What it does:

- Loads opportunity detail, activities/timeline.
- Allows edit.
- Allows stage change, mark won, mark lost, delete.
- Shows related customer or lead.
- Shows "Create Quotation" only when opportunity is won.

Major business mismatch:

- Current FE requires opportunity won before creating quotation.
- Backend supports quotation linked to opportunity before won, and Sale Order approval can update opportunity to won.
- More natural expected flow is opportunity negotiation -> quotation -> customer accepts -> sale order approval -> opportunity won.
- Current FE reverses that by forcing won before quotation.

Response mismatch:

- Backend `markWon` returns `{ opp, customer }`.
- Redux `markWon.fulfilled` expects direct Opportunity and updates `updated.id`; this fails for list state.
- Detail page refetches after markWon, so detail may recover, but list/board state update is still wrong.

API mismatch:

- Frontend `updateOpportunity` uses `PUT /crm/opportunities/:id`.
- Backend route is `PATCH /crm/opportunities/:oppId`.
- Opportunity edit page will fail unless fixed.

API mismatch:

- Frontend `moveToNegotiation` uses `PATCH /crm/opportunities/:id/negotiation`.
- Backend route is `POST /crm/opportunities/:oppId/negotiation`.

API mismatch:

- Frontend `getClosingThisMonth` and `getUnclosedOpportunities` use DELETE.
- Backend routes are GET.

Backend route-order issue impacting FE:

- Backend has `router.get("/opportunities/:oppId")` before static routes like `/opportunities/pipeline-summary`, `/opportunities/closing-this-month`, `/opportunities/unclosed`.
- Express will match static paths as `oppId`; these routes may be unreachable.

### Opportunity Create

Page: `erp-frontend/src/features/crm/page/OpportunityCreatePage.tsx`

What it does:

- Loads leads and customer partners.
- Lets user choose related type `lead` or `customer`.
- Sends `related_type`, `related_id`, pipeline/stage, expected value, probability, currency, exchange rate.
- Backend controller maps related type to `lead_id` or `customer_id`, sets `owner_id` from current user.

Alignment:

- This is mostly aligned with backend.

### CRM Activity

Pages: call/email/meeting/task create/list/detail/update.

What it does:

- Supports call/email/meeting/task creation and management.
- Loads partners for related customer selection in create pages.
- Detail pages allow complete/cancel/delete for some activity types.

Issues:

- Several detail pages still use `window.confirm`, which violates frontend rules. Found in CallDetailPage, MeetingDetailPage, TaskDetailPage.
- `activity.api.reassignActivity` sends `PATCH /crm/activities/reassign` but backend route is `PATCH /crm/activities/reassign/:id`. This likely breaks reassign activity if used.

### CRM Settings

Pages: LeadSourcePage, PipelinePage, ScoringRulePage.

What it does:

- Lead sources CRUD.
- Pipeline and stage CRUD.
- Scoring rules CRUD.
- Restricted by route to `SALESMANAGER`, `ADMIN`.

Alignment:

- Mostly aligned. Uses `ActionConfirmModal` for delete.

## Sales Frontend Flow

### Quotation List/Create/Edit/Detail

Pages:

- `QuotationListPage.tsx`
- `QuotationCreatePage.tsx`
- `QuotationEditPage.tsx`
- `QuotationDetailPage.tsx`
- `QuotationForm.tsx`

What create does:

- Loads customers via partner store.
- Loads products.
- Reads `opportunity_id` query param.
- If opportunity has `customer_id`, pre-fills customer.
- Dispatches `createQuotation({ ...data, opportunity_id })`.

Issues in create:

- If opportunity is linked only to lead and not customer, prefill customer is empty.
- Because FE only shows Create Quotation on won opportunity, backend `markWon` usually creates customer, so this can work after markWon.
- `CreateQuotationDto` lacks fields backend supports: `currency_id`, `exchange_rate`, `payment_term_id`, `price_list_id`, `sales_person_id`.

What detail allows:

- Edit if `approval_status=draft`.
- Submit if `approval_status=draft`.
- Approve/reject if `approval_status=waiting_approval` and role is `SALESMANAGER` or `ADMIN`.
- Mark accepted if `approval_status=approved`.
- Convert to order if `status=accepted`.

Issues in detail:

- `canSubmit` has no role/creator check; any user with detail route access can submit if draft. Detail route includes `ACCOUNT` and `CEO`.
- `canAccept` has no role check; any detail viewer can mark customer accepted.
- `rejectQuotation` exists in FE but backend route `/sales/quotations/:id/reject` does not exist.
- `QuotationEditPage` calls update quotation, but backend service currently throws `Update quotation logic pending`.
- Backend `convertToOrder` sets quotation status to `"converted"`, but backend model enum and FE `QuotationStatus` do not include `"converted"`. This can fail conversion or create status/type drift.

Major business mismatch:

- FE says quote can be created from opportunity only after opportunity is won.
- Backend has a loopback from Sale Order approval to Opportunity won, which implies quote/order should happen before won.

### Sale Order List

Page/component:

- `SaleOrderListPage.tsx`
- `SaleOrderTable.tsx`

What it allows:

- View all visible orders.
- `SALES` can edit own draft order.
- `SALES` can submit own draft order.
- `SALESMANAGER` can approve/reject waiting approval order.
- Uses `ActionConfirmModal` for reject reason.

Alignment:

- List/table action permissions are close to backend service rules.
- Backend also validates branch and owner.

### Sale Order Create/Edit

Pages/components:

- `SaleOrderCreatePage.tsx`
- `SaleOrderEditPage.tsx`
- `SaleOrderForm.tsx`

What create does:

- Loads customers and products.
- Dispatches `createSaleOrder`.
- Navigates to order detail.

What edit does:

- Available route only for `SALES`.
- Backend enforces draft, same branch, owner if SALES.

Issues:

- `CreateSaleOrderDto` and `UpdateSaleOrderDto` are minimal and do not include newer backend fields like `currency_id`, `exchange_rate`, `payment_term_id`, discount, delivery address, customer PO number, sales person, internal/customer notes.

### Sale Order Detail

Page: `SaleOrderDetailPage.tsx`

What it allows:

- Edit if `approval_status=draft`.
- Submit if `approval_status=draft`.
- Approve/reject if `approval_status=waiting_approval` and role is `SALESMANAGER` or `ADMIN`.
- Generate invoice if `approval_status=approved`.

Issues:

- Detail page `canEdit` and `canSubmit` do not check role or owner. Any user with detail route access can see the actions on draft order.
- Detail route includes `ACCOUNT`, `CHACC`, `WHSTAFF`, `CEO`, `ADMIN`; these can see submit/edit actions when draft, although backend will reject many cases.
- `canInvoice` has no role check; any detail viewer can generate invoice when approved. This likely should be `ACCOUNT`/`CHACC` depending on business rule.
- Detail page action visibility is less strict than `SaleOrderTable`; table is closer to correct.

### AR Invoice

Pages/store/API:

- Invoice list/detail/container.
- `invoice.slice.ts` supports create, fetch available orders, submit, approve, reject.
- InvoiceActionButtons allows:
  - `ACCOUNT`: submit draft invoice.
  - `CHACC`: approve/reject waiting approval invoice.

Alignment:

- This matches typical backend AP/AR approval style better than SaleOrderDetail.

Issues:

- Some UI uses raw `<button>` and custom status styles instead of shared Button/StatusBadge.
- Sales routes allow `SALES` and `SALESMANAGER` into invoice screens; action buttons restrict submit/approve, but route-level permission is broad.

### AR Receipt

Pages/store/API:

- Receipt list/create/detail.
- `receipt.slice.ts` supports create/update/submit/approve/reject/allocate/unpaid invoices/customer debt/filter.

What it allows:

- Receipt create/detail routes are `ACCOUNT`, `CHACC`.
- Receipt list route is broad: `SALES`, `SALESMANAGER`, `ACCOUNT`, `CHACC`.
- Detail page:
  - `ACCOUNT` can submit.
  - `CHACC` can approve/reject.
  - Allocation is available after receipt state supports it.

Issues:

- ReceiptDetailPage has hand-written modal/status styling rather than shared `ActionConfirmModal`/`StatusBadge` in places.
- The high-level business flow is present.

## API Contract Issues To Fix

High priority:

1. FE `updateOpportunity` must use PATCH, not PUT.
2. FE `moveToNegotiation` must use POST, not PATCH, or backend route must change.
3. FE `getClosingThisMonth` and `getUnclosedOpportunities` must use GET, not DELETE.
4. Backend CRM static opportunity routes must be moved before `/opportunities/:oppId`.
5. Lead reassign must pass `leadId` in body or backend must read `req.params.leadId`.
6. `convertLead` response handling must expect `{ lead, customer }`, or backend should return lead directly.
7. `markWon` response handling must expect `{ opp, customer }`, or backend should return opportunity directly.
8. Add backend quotation reject route/service or remove FE reject quotation action.
9. Implement backend quotation update or disable/hide quotation edit.
10. Add `"converted"` to quotation backend enum, migration and FE type, or stop writing status `"converted"`.

Business priority:

1. Decide correct CRM-to-Sales flow:
   - Option A: Opportunity becomes won before quotation. Current FE follows this.
   - Option B: Opportunity becomes won after accepted quote / approved Sale Order. Backend SaleOrder approval loopback implies this is intended.
2. If Option B, allow creating quotation from opportunity before won, especially in negotiation/prospecting stages.
3. Align SaleOrderDetail action visibility with SaleOrderTable and backend rules.
4. Restrict Generate Invoice to accounting roles if that is intended.
5. Add frontend fields for currency/payment term/discount/delivery/customer PO if Phase 3 sales enhancement is intended to be user-facing.

Design/rule priority:

1. Replace CRM activity `window.confirm` usages with `ActionConfirmModal`.
2. Replace custom activity lost modal in `OppStageActions` with shared modal or at least align styling.
3. Replace raw invoice/receipt buttons/status badges with shared components where practical.

## Current FE Coverage Summary

Implemented and mostly usable:

- Lead list/create/detail/update/evaluate/lost/reopen/delete.
- Opportunity list/board/create/detail/stage change/won/lost/delete.
- CRM settings lead source/pipeline/scoring rule.
- CRM activities call/email/meeting/task core screens.
- Quotation list/create/detail/submit/approve/accept/convert UI.
- Sale Order list/create/detail/edit/submit/approve/reject UI.
- AR invoice and receipt approval/allocation UI.

Partially implemented or misleading:

- Lead convert: converts to customer only, but FE navigates to opportunities and slice expects lead.
- Quotation edit: UI exists, backend missing.
- Quotation reject: FE exists, backend missing.
- Opportunity create quotation: only after won, likely opposite of intended Sales pipeline.
- Sale Order detail actions: overexposed by role/owner.

Known broken from API mismatch:

- Opportunity edit.
- Opportunity move to negotiation.
- Opportunity closing/unclosed API calls.
- Lead reassign.
- Activity reassign if used.
- Quotation reject.
- Quotation convert may fail because `"converted"` is not in enum.

## Recommended Fix Order

1. Fix API contract mismatches first.
2. Fix response shape handling for lead convert and opportunity mark won.
3. Decide opportunity-to-quotation business direction.
4. Fix quotation update/reject/converted status.
5. Align SaleOrderDetail action permissions.
6. Clean up confirm modals and shared component usage.

