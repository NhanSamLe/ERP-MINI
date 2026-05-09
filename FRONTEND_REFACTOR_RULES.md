# 🎨 ERP-MINI — Frontend Refactor Rules

> **ĐỌC FILE NÀY TRƯỚC KHI BẮT ĐẦU BẤT KỲ REFACTOR FRONTEND NÀO.**
>
> File này là source-of-truth về design system, component usage, layout patterns
> và anti-patterns của dự án ERP-MINI frontend.  
> Nếu bạn không tuân thủ → code sẽ không consistent → merge request bị reject.

---

## 0. Mindset

Đây là phần mềm **Enterprise ERP** dành cho doanh nghiệp, KHÔNG phải consumer app.

| ✅ Enterprise ERP          | ❌ Không phải             |
|---------------------------|--------------------------|
| Clean, compact, dense     | Oversized cards/padding  |
| Muted colors + orange accent | Rainbow colors        |
| 13–14px body text          | 16–18px body text       |
| 8–12px border radius       | 24–40px border radius   |
| Information-dense tables  | "Modern" airy layouts    |
| Functional first          | Visual gimmicks          |

---

## 1. Design Tokens — Nguồn Gốc Màu Sắc

### Primary Palette (Orange + White)

```
Primary:     #f97316  →  orange-500   (bg-orange-500)
Primary Hover:#ea580c →  orange-600   (hover:bg-orange-600)
Primary Light:#fff7ed →  orange-50    (bg-orange-50, bg-orange-100)
Primary Text: #c2410c →  orange-700   (text-orange-700)
```

### Surface & Layout

```
Page BG:     #f9fafb  →  gray-50      (bg-gray-50)
Card BG:     #ffffff  →  white        (bg-white)
Border:      #e5e7eb  →  gray-200     (border-gray-200)
Divider:     #f3f4f6  →  gray-100     (border-gray-100)
```

### Text Scale

```
Page Title:  #111827  →  gray-900  font-semibold text-base (16px)
Section Title:#1f2937 →  gray-800  font-semibold text-sm   (14px)
Body:        #374151  →  gray-700  font-normal   text-sm   (14px)
Secondary:   #6b7280  →  gray-500  font-normal   text-xs   (12px)
Disabled:    #9ca3af  →  gray-400
```

### Status Colors — CHỈ dùng bảng này

| Status            | bg           | text         |
|-------------------|--------------|--------------|
| draft             | gray-100     | gray-600     |
| new               | blue-50      | blue-600     |
| pending           | amber-50     | amber-700    |
| waiting_approval  | orange-50    | orange-600   |
| in_progress       | indigo-50    | indigo-600   |
| approved          | emerald-50   | emerald-700  |
| completed         | emerald-50   | emerald-700  |
| paid              | green-50     | green-700    |
| rejected          | red-50       | red-600      |
| cancelled         | gray-50      | gray-400     |
| active            | emerald-50   | emerald-700  |

---

## 2. Typography Rules

```
KHÔNG được dùng:
  ❌ font-black       → dùng font-semibold hoặc font-bold
  ❌ text-3xl         → max text-2xl cho page title, text-base cho heading
  ❌ tracking-widest  → chỉ dùng cho label nhỏ, uppercase (text-[10px])
  ❌ text-[10px] cho body → minimum text-xs (12px)

NÊN dùng:
  ✅ Page title:   text-base font-semibold text-gray-900
  ✅ Section head: text-sm font-semibold text-gray-800
  ✅ Table head:   text-xs font-semibold text-gray-500 uppercase tracking-wider
  ✅ Body text:    text-sm text-gray-700
  ✅ Caption/hint: text-xs text-gray-500
  ✅ Micro label:  text-[10px] font-bold text-gray-400 uppercase tracking-widest
```

---

## 3. Spacing Rules

```
Page padding:   p-6   (24px — page-container class)
Card padding:   px-5 py-4
Table cell:     px-4 py-3
Section header: px-5 py-3.5
Button height:  h-8  (action buttons), h-9 (primary inputs)
Input height:   h-9  (36px)
Gap trong form: gap-4 (fields), gap-6 (sections)
```

---

## 4. Border Radius Rules

```
❌ KHÔNG dùng: rounded-[2.5rem], rounded-[2rem], rounded-3xl, rounded-2xl
   (trừ modal backdrop hoặc avatar)

✅ NÊN dùng:
  Page cards:     rounded-lg  (8px)
  Buttons:        rounded-md  (6px)
  Inputs:         rounded-md  (6px)
  Badges/pills:   rounded-full
  Sidebar items:  rounded-md
  Icon wrappers:  rounded-lg hoặc rounded-md
  Modal:          rounded-xl  (12px — chấp nhận vì floating)
```

---

## 5. Component Registry — Dùng Đúng Component

### 5.1 Button

```tsx
import { Button } from "@/components/ui/Button";

// Variants
<Button variant="primary">   // orange — hành động chính
<Button variant="secondary"> // gray-700 — hành động phụ
<Button variant="outline">   // border, white bg — neutral
<Button variant="ghost">     // text-only orange
<Button variant="danger">    // red — destructive
<Button variant="success">   // emerald — confirm positive
<Button variant="warning">   // amber

// Sizes
<Button size="xs">  // h-6 px-2 — rất nhỏ (trong table)
<Button size="sm">  // h-7 px-3 — nhỏ (trong card header)
<Button size="md">  // h-9 px-4 — mặc định (form)
<Button size="lg">  // h-11 px-6 — lớn (auth page)

// Loading
<Button loading={isSubmitting}>Save</Button>

// With icon
<Button leftIcon={<Plus className="w-3.5 h-3.5" />}>New Order</Button>
```

> **RULE**: KHÔNG tự style `<button>` bằng Tailwind để tạo button chính.
> LUÔN dùng `<Button>` từ `@/components/ui/Button`.

---

### 5.2 FormInput

```tsx
import { FormInput } from "@/components/ui/FormInput";

<FormInput
  label="Customer Name"
  value={form.name}
  onChange={(v) => setForm({ ...form, name: v })}
  required
  placeholder="Enter customer name"
  error={errors.name}
  hint="Will be printed on invoice"
/>

// Textarea mode
<FormInput textarea rows={4} label="Notes" value={...} onChange={...} />

// Read-only (detail view)
<FormInput readOnly label="Order No" value={order.order_no} />
```

> **RULE**: Không tự viết `<input className="w-full px-4...">`.
> Mọi form field → `<FormInput>`.

---

### 5.3 StatusBadge

```tsx
import { StatusBadge } from "@/components/common";

<StatusBadge status={order.approval_status} />
// Renders: dot + label, rounded-full, semantic color
```

> **RULE**: KHÔNG tự code badge cho status. Dùng `StatusBadge`.

---

### 5.4 DataTable

```tsx
import { DataTable } from "@/components/ui/DataTable";

<DataTable
  data={items}
  columns={[
    { key: "order_no", label: "Order No", sortable: true },
    { key: "customer", label: "Customer",
      render: (row) => row.customer?.name },
    { key: "status", label: "Status",
      render: (row) => <StatusBadge status={row.status} /> },
  ]}
  onRowClick={(row) => navigate(`/orders/${row.id}`)}
  searchable
  searchKeys={["order_no"]}
  itemsPerPage={10}
  showSelection={false}
  showActions={false}  // nếu dùng render trong columns thì false
/>
```

> **KÍCH THƯỚC**: `DataTable` phù hợp cho simple list không có custom actions phức tạp.
> Nếu cần custom actions per row → tạo `<XxxTable>` riêng như `SaleOrderTable`.

---

### 5.5 ActionConfirmModal

```tsx
import { ActionConfirmModal } from "@/components/common";

<ActionConfirmModal
  isOpen={activeModal === "reject"}
  onClose={() => setActiveModal(null)}
  title="Reject Order"
  description="Are you sure you want to reject this order?"
  confirmText="Reject"
  variant="danger"          // primary | danger | success | warning
  requireReason             // hiện textarea nhập lý do
  onConfirm={async (reason) => {
    await dispatch(rejectOrder({ id, reason })).unwrap();
    setActiveModal(null);
  }}
/>
```

> **RULE**: KHÔNG dùng `window.confirm()`. KHÔNG tự tạo modal xác nhận.
> Dùng `ActionConfirmModal` cho mọi confirmation action.

---

### 5.6 SearchSelectionModal

```tsx
import { SearchSelectionModal } from "@/components/common";

<SearchSelectionModal
  isOpen={showPicker}
  onClose={() => setShowPicker(false)}
  title="Select Customer"
  items={partners}
  searchKeys={["name", "tax_code"]}
  onSelect={(partner) => setForm({ ...form, customer_id: partner.id })}
  isSelected={(p) => p.id === form.customer_id}
  renderItem={(p) => (
    <div>
      <p className="text-sm font-medium text-gray-800">{p.name}</p>
      <p className="text-xs text-gray-500">{p.tax_code}</p>
    </div>
  )}
/>
```

---

## 6. Layout Patterns — Chọn Đúng Layout

### 6.1 List Page (Danh sách)

```
Dùng cho: Orders List, Partners List, Products List...

Pattern:
  <div className="page-container">         ← p-6 space-y-5
    <div className="erp-card overflow-hidden">
      <!-- Header: title + icon + count badge + action buttons -->
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
      
      <!-- Filters bar -->
      <div className="px-5 py-3 border-b border-gray-100 bg-gray-50/50">
      
      <!-- Table/Content -->
      <XxxTable items={paginatedItems} />
      
      <!-- Pagination footer -->
      <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 bg-gray-50/50">
    </div>
  </div>
```

### 6.2 Detail / Form Page (StandardFormLayout)

```
Dùng cho: Order Detail, Invoice Detail, Lead Detail...

<StandardFormLayout
  title="SO-2025-001"
  description="Sale Order · Reference #42"
  statusBadge={<StatusBadge status={order.status} />}
  breadcrumb={[
    { label: "Sale Orders", onClick: () => navigate("/sales/orders") },
    { label: order.order_no },
  ]}
  actions={[
    { label: "Back", variant: "outline", onClick: () => navigate(-1) },
    { label: "Submit", variant: "primary", onClick: handleSubmit, isLoading: loading },
  ]}
  sidebarContent={<SummarySection />}     // optional right sidebar
>
  <FormSection title="Customer Info" icon={<User size={16} />}>
    {/* fields */}
  </FormSection>
  
  <FormSection title="Line Items" icon={<ShoppingCart size={16} />}>
    {/* table */}
  </FormSection>
</StandardFormLayout>
```

### 6.3 FormSection

```tsx
import { FormSection } from "@/components/layout";

<FormSection
  title="General Information"
  icon={<FileText className="w-4 h-4" />}    // icon size: w-4 h-4 (16px)
  description="Basic order details"          // optional subtitle
  action={<Button size="sm" variant="outline">Edit</Button>}  // optional header action
  noPadding={false}                          // true nếu dùng cho table (no px-5 py-4)
>
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    <FormInput label="Customer" ... />
    <FormInput label="Date" ... />
  </div>
</FormSection>
```

> **ICON SIZE** trong FormSection header: `w-4 h-4` (16px).  
> Wrapper tự thêm `w-7 h-7 bg-orange-50 rounded-lg`.

---

## 7. Page Header Rules

Mỗi list page phải có header theo template sau:

```tsx
// Header của list page
<div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
  <div className="flex items-center gap-2.5">
    {/* Module icon */}
    <span className="w-8 h-8 bg-orange-50 rounded-lg flex items-center justify-center">
      <Package className="w-4 h-4 text-orange-500" />
    </span>
    <div>
      <h1 className="text-base font-semibold text-gray-900">Products</h1>
      <p className="text-xs text-gray-400 mt-0.5">Manage product catalog</p>
    </div>
    {/* Count badge */}
    <span className="ml-1 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-orange-50 text-orange-600">
      {items.length}
    </span>
  </div>

  <div className="flex items-center gap-2">
    {/* Secondary action */}
    <button className="inline-flex items-center gap-1.5 h-8 px-3 text-sm font-medium text-gray-600 border border-gray-300 bg-white rounded-md hover:bg-gray-50 transition-colors">
      <Download className="w-3.5 h-3.5" />
      Export
    </button>
    {/* Primary action */}
    <Link to="/xxx/create" className="inline-flex items-center gap-1.5 h-8 px-3 text-sm font-medium text-white bg-orange-500 rounded-md hover:bg-orange-600 transition-colors shadow-sm">
      <Plus className="w-3.5 h-3.5" />
      New Product
    </Link>
  </div>
</div>
```

---

## 8. Table Design Rules

```tsx
// Table header row
<thead>
  <tr className="border-b border-gray-200 bg-gray-50/80">
    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
      Order No
    </th>
  </tr>
</thead>

// Table body row
<tbody className="divide-y divide-gray-100">
  <tr className="hover:bg-orange-50/40 transition-colors duration-100">
    <td className="px-4 py-3 text-sm text-gray-800">...</td>
  </tr>
</tbody>

// Action buttons trong table cell
<div className="flex items-center justify-end gap-1">
  <button className="p-1.5 rounded text-gray-400 hover:text-orange-600 hover:bg-orange-50 transition-colors">
    <Edit className="w-3.5 h-3.5" />
  </button>
  <button className="p-1.5 rounded text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors">
    <Trash2 className="w-3.5 h-3.5" />
  </button>
</div>
```

**Icon size trong table actions**: `w-3.5 h-3.5` (14px).

---

## 9. Filter Bar Rules

```tsx
// Filter bar dưới page header
<div className="px-5 py-3 border-b border-gray-100 bg-gray-50/50">
  <div className="flex items-center gap-3 flex-wrap">
    {/* Search input */}
    <div className="relative flex-1 min-w-[200px] max-w-xs">
      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
      <input
        placeholder="Search..."
        className="w-full h-8 pl-8 pr-3 text-sm border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 placeholder:text-gray-400"
      />
    </div>
    
    {/* Select filter */}
    <select className="h-8 pl-3 pr-8 text-sm border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-orange-500">
      <option value="">All Status</option>
    </select>
  </div>
</div>
```

**Filter input height**: `h-8` (32px) — nhỏ hơn form input (`h-9`) để phân biệt.

---

## 10. Loading & Empty State Rules

```tsx
// Loading spinner
<div className="flex flex-col items-center justify-center py-16 gap-3 text-gray-400">
  <div className="w-6 h-6 border-2 border-orange-200 border-t-orange-500 rounded-full animate-spin" />
  <span className="text-sm">Loading...</span>
</div>

// Empty state
<div className="py-16 flex flex-col items-center gap-2 text-gray-400">
  <Inbox className="w-10 h-10" />
  <p className="text-sm font-medium">No records found</p>
</div>
```

---

## 11. Inline Action Buttons (Header bar của StandardFormLayout)

```tsx
// Trong actions[] của StandardFormLayout — KHÔNG phải Button component
// Vì StandardFormLayout tự render buttons

actions={[
  { label: "Cancel",  variant: "outline",   onClick: () => navigate(-1) },
  { label: "Save",    variant: "primary",   onClick: handleSave,   isLoading: saving },
  { label: "Approve", variant: "success",   onClick: handleApprove },
  { label: "Reject",  variant: "danger",    onClick: () => setModal("reject") },
]}
```

---

## 12. Anti-Patterns — TUYỆT ĐỐI KHÔNG LÀM

### ❌ Rounded quá mức

```tsx
// ❌ SAI — consumer app style
<div className="rounded-[2.5rem]">
<div className="rounded-3xl">
<button className="rounded-2xl px-8 py-3.5">

// ✅ ĐÚNG — enterprise style
<div className="rounded-lg">
<button className="rounded-md h-8 px-4">
```

### ❌ Font quá đậm, quá to

```tsx
// ❌ SAI
<h1 className="text-3xl font-black tracking-tight">
<span className="text-xl font-black uppercase tracking-widest">

// ✅ ĐÚNG
<h1 className="text-base font-semibold text-gray-900">
<span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
```

### ❌ Gradient và hiệu ứng thừa

```tsx
// ❌ SAI — không cần thiết cho ERP
<header className="bg-white/70 backdrop-blur-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
<h1 className="bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">

// ✅ ĐÚNG — clean, professional
<header className="bg-white border-b border-gray-200 shadow-sm">
<h1 className="text-base font-semibold text-gray-900">
```

### ❌ Màu không nhất quán

```tsx
// ❌ SAI — không nhất quán
focus:ring-orange-400  // sai, phải là 500
bg-blue-900            // không phải brand color
text-blue-600          // dùng cho links, không cho primary action

// ✅ ĐÚNG
focus:ring-2 focus:ring-orange-500 focus:border-orange-500
bg-orange-500
text-orange-600 (text link)
```

### ❌ Tự tạo modal, button, badge từ đầu

```tsx
// ❌ SAI
<div className="fixed inset-0 z-50 flex items-center ...">  // tự tạo modal
  <div className="bg-white rounded-lg p-6 ...">
    <button className="bg-red-600 text-white px-4 py-2 rounded">Reject</button>
  </div>
</div>

// ✅ ĐÚNG — dùng ActionConfirmModal
<ActionConfirmModal variant="danger" onConfirm={handleReject} ... />
```

### ❌ Import từ buttonn.tsx trong code mới

```tsx
// ❌ SAI — chỉ tồn tại vì backward compat với CRM pages cũ
import { Button } from "@/components/ui/buttonn";

// ✅ ĐÚNG — luôn import từ đây
import { Button } from "@/components/ui/Button";
```

---

## 13. CSS Utility Classes (Global)

Các class được định nghĩa trong `index.css`:

```tsx
className="page-container"   // p-6 space-y-5 — wrapper cho nội dung trang
className="erp-card"         // bg-white border border-gray-200 rounded-lg shadow-sm
className="focus-ring"       // focus:outline-none focus:ring-2 focus:ring-orange-500
className="table-row-hover"  // hover:bg-orange-50/60 transition-colors
```

---

## 14. Icon Rules

```
Thư viện:    lucide-react (KHÔNG dùng react-icons trừ social buttons)

Size theo context:
  Page icon (sidebar/header):  w-4 h-4  (16px)
  Form section icon:           w-4 h-4  (16px) — wrapper tự thêm bg
  Table action icon:           w-3.5 h-3.5 (14px)
  Button icon:                 w-3.5 h-3.5 (14px)
  Empty state icon:            w-8 h-8 đến w-10 h-10
  Loading spinner:             w-6 h-6 (border-t-orange-500)

Color:
  In orange context:    text-orange-500
  Neutral (table):      text-gray-400 hover:text-orange-600
  In buttons:           inherit (text-current hoặc text-white)
```

---

## 15. Checklist Trước Khi Submit Refactor

- [ ] Màu primary: `orange-500` (không phải 400, không phải 600)
- [ ] Focus ring: `focus:ring-2 focus:ring-orange-500`
- [ ] Border radius: `rounded-md` (buttons/inputs), `rounded-lg` (cards)
- [ ] Font weight: `font-semibold` (không `font-black`)
- [ ] Page title size: `text-base` (không `text-xl`, `text-2xl`)
- [ ] Body text: `text-sm text-gray-700`
- [ ] Button import: `from "@/components/ui/Button"` (không `buttonn`)
- [ ] Status: dùng `<StatusBadge>` (không tự code badge)
- [ ] Confirm dialog: dùng `<ActionConfirmModal>` (không `window.confirm()`)
- [ ] Search modal: dùng `<SearchSelectionModal>`
- [ ] Table cell padding: `px-4 py-3`
- [ ] Loading state: spinner `border-t-orange-500`
- [ ] Empty state: `Inbox` icon + "No records found"
- [ ] Không có `rounded-[2.5rem]`, `rounded-3xl`, `rounded-2xl`
- [ ] Không có `font-black`, `tracking-widest` (trừ micro label)
- [ ] Không có `bg-gradient-to-r ... bg-clip-text text-transparent`
- [ ] Không có `window.confirm()` hay `window.alert()`

---

## 16. File nên đọc trước khi refactor 1 feature

```
1. erp-frontend/src/styles/index.css          ← CSS variables, utility classes
2. erp-frontend/tailwind.config.js            ← Tailwind extensions
3. erp-frontend/src/config/design-tokens.ts   ← Design token reference
4. erp-frontend/src/components/ui/Button.tsx  ← Button API
5. erp-frontend/src/components/ui/FormInput.tsx
6. erp-frontend/src/components/layout/StandardFormLayout.tsx
7. erp-frontend/src/components/layout/FormSection.tsx
8. erp-frontend/src/components/common/StatusBadge.tsx
9. erp-frontend/src/components/common/ActionConfirmModal.tsx
10. erp-frontend/src/features/sales/pages/SaleOrderListPage.tsx   ← Template: list page
11. erp-frontend/src/features/sales/pages/SaleOrderDetailPage.tsx ← Template: detail page
```

---

*Last updated: 2026-04-26 — Refactored by Claude (Sonnet 4.6)*  
*Sync với: [AI_CODING_RULES.md](../AI_CODING_RULES.md)*
