import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  ArrowLeft,
  CheckSquare,
  Clock,
  Mail,
  MapPin,
  Phone,
  UserRound,
  Video,
} from "lucide-react";
import { RootState } from "@/store/store";
import { toast } from "react-toastify";
import { Button } from "@/components/ui/Button";
import { FormInput } from "@/components/ui/FormInput";
import { ActivityType } from "@/types/enum";
import { getAllLeads } from "../service/lead.service";
import { getAllOpportunities } from "../service/opportunity.service";
import { fetchPartners } from "../../partner/partner.service";
import {
  createCallActivity,
  createEmailActivity,
  createMeetingActivity,
  createTaskActivity,
} from "../service/activity.service";
import { Lead } from "../dto/lead.dto";
import { Opportunity } from "../dto/opportunity.dto";
import { Partner } from "../../partner/store/partner.types";

type RelatedType = "lead" | "opportunity" | "customer";
type Priority = "low" | "medium" | "high";

interface RelatedItem {
  id: number;
  name: string;
  email?: string | null;
  phone?: string | null;
  subtitle?: string | null;
}

const inputClass =
  "w-full h-9 rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none transition-colors focus:border-orange-500 focus:ring-2 focus:ring-orange-500";

const textareaClass =
  "w-full min-h-24 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition-colors focus:border-orange-500 focus:ring-2 focus:ring-orange-500";

const PRIORITIES: Array<{ value: Priority; label: string }> = [
  { value: "low", label: "Thấp" },
  { value: "medium", label: "Trung bình" },
  { value: "high", label: "Cao" },
];

function toLocalDateTimeInput(date = new Date()) {
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return localDate.toISOString().slice(0, 16);
}

function getTitle(type: ActivityType) {
  if (type === "call") return "Ghi nhận cuộc gọi";
  if (type === "email") return "Soạn email";
  if (type === "meeting") return "Lên lịch cuộc họp";
  return "Tạo công việc";
}

function getDescription(type: ActivityType) {
  if (type === "call") return "Lưu lịch sử gọi đến/gọi đi và bước xử lý tiếp theo.";
  if (type === "email") return "Ghi nhận email gửi/nhận gắn với khách hàng tiềm năng, cơ hội hoặc khách hàng.";
  if (type === "meeting") return "Lên lịch demo, tư vấn hoặc trao đổi với khách hàng.";
  return "Tạo việc cần làm để chăm sóc hoặc đẩy tiến độ bán hàng.";
}

function getIcon(type: ActivityType) {
  if (type === "call") return <Phone className="h-4 w-4 text-orange-600" />;
  if (type === "email") return <Mail className="h-4 w-4 text-sky-600" />;
  if (type === "meeting") return <Video className="h-4 w-4 text-violet-600" />;
  return <CheckSquare className="h-4 w-4 text-orange-600" />;
}

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="mb-1.5 block text-sm font-medium text-gray-700">
      {children}
      {required && <span className="ml-0.5 text-red-500">*</span>}
    </label>
  );
}

function SectionTitle({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="flex h-8 w-8 items-center justify-center rounded-md bg-orange-50 text-orange-600">{icon}</span>
      <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
    </div>
  );
}

function RelatedPreview({ item }: { item?: RelatedItem }) {
  if (!item) {
    return (
      <div className="rounded-md border border-dashed border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-500">
        Chọn đối tượng liên quan để xem nhanh thông tin liên hệ.
      </div>
    );
  }

  return (
    <div className="grid gap-3 rounded-md border border-gray-200 bg-gray-50 p-4 md:grid-cols-3">
      <div className="min-w-0">
        <p className="text-xs text-gray-500">Tên</p>
        <p className="truncate text-sm font-semibold text-gray-900">{item.name}</p>
        {item.subtitle && <p className="truncate text-xs text-gray-500">{item.subtitle}</p>}
      </div>
      <div className="min-w-0">
        <p className="text-xs text-gray-500">Email</p>
        <p className="truncate text-sm font-medium text-gray-800">{item.email || "-"}</p>
      </div>
      <div className="min-w-0">
        <p className="text-xs text-gray-500">Số điện thoại</p>
        <p className="truncate text-sm font-medium text-gray-800">{item.phone || "-"}</p>
      </div>
    </div>
  );
}

export function ActivityCreateView({ type }: { type: ActivityType }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const user = useSelector((state: RootState) => state.auth.user);
  const ownerEmail = user?.email || "";
  const ownerPhone = user?.phone || "";

  const initialRelatedType = (searchParams.get("related_type") as RelatedType | null) || "lead";
  const initialRelatedId = searchParams.get("related_id") || "";

  const [leads, setLeads] = useState<RelatedItem[]>([]);
  const [opps, setOpps] = useState<RelatedItem[]>([]);
  const [customers, setCustomers] = useState<RelatedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);


  const [form, setForm] = useState({
    subject: "",
    related_type: initialRelatedType,
    related_id: initialRelatedId,
    priority: "medium" as Priority,
    notes: "",
    direction: "out" as "in" | "out",
    call_from: ownerPhone,
    call_to: "",
    email_from: ownerEmail,
    email_to: "",
    start_at: "",
    end_at: "",
    due_at: "",
    reminder_at: "",
    location: "",
    attendees: "",
    meeting_link: "",
  });

  const update = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [leadList, oppList, customerList] = await Promise.all([
          getAllLeads(),
          getAllOpportunities(),
          fetchPartners({ type: "customer", status: "active" }),
        ]);

        setLeads(
          (leadList as Lead[]).map((lead) => ({
            id: lead.id,
            name: lead.name,
            email: lead.email,
            phone: lead.phone,
            subtitle: lead.company_name || lead.stage,
          }))
        );
        setOpps(
          (oppList as Opportunity[]).map((opp) => ({
            id: opp.id,
            name: opp.name,
            email: opp.lead?.email || opp.customer?.email,
            phone: opp.lead?.phone || opp.customer?.phone,
            subtitle: opp.customer?.name || opp.lead?.name,
          }))
        );
        setCustomers(
          (customerList as Partner[]).map((customer) => ({
            id: customer.id,
            name: customer.name,
            email: customer.email,
            phone: customer.phone,
            subtitle: customer.contact_person || customer.tax_code,
          }))
        );
      } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || "Không thể tải dữ liệu liên quan");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  useEffect(() => {
    if (type === "call") {
      update("call_from", form.direction === "out" ? ownerPhone : form.call_from);
      update("call_to", form.direction === "out" ? form.call_to : ownerPhone);
    }
    if (type === "email") {
      update("email_from", form.direction === "out" ? ownerEmail : form.email_from);
      update("email_to", form.direction === "out" ? form.email_to : ownerEmail);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ownerEmail, ownerPhone, type]);

  const relatedList = useMemo(() => {
    if (form.related_type === "lead") return leads;
    if (form.related_type === "opportunity") return opps;
    return customers;
  }, [customers, form.related_type, leads, opps]);

  const selectedRelated = relatedList.find((item) => item.id === Number(form.related_id));

  const applyContact = (nextRelatedId = form.related_id, nextDirection = form.direction) => {
    const item = relatedList.find((related) => related.id === Number(nextRelatedId));
    const targetEmail = item?.email || "";
    const targetPhone = item?.phone || "";

    if (nextDirection === "out") {
      update("call_from", ownerPhone);
      update("call_to", targetPhone);
      update("email_from", ownerEmail);
      update("email_to", targetEmail);
    } else {
      update("call_from", targetPhone);
      update("call_to", ownerPhone);
      update("email_from", targetEmail);
      update("email_to", ownerEmail);
    }
  };

  const handleRelatedTypeChange = (value: RelatedType) => {
    update("related_type", value);
    update("related_id", "");
    update("call_to", "");
    update("email_to", "");
  };

  const handleRelatedIdChange = (value: string) => {
    update("related_id", value);
    applyContact(value);
  };

  const handleDirectionChange = (value: "in" | "out") => {
    update("direction", value);
    applyContact(form.related_id, value);
  };

  const validate = () => {
    if (!form.subject.trim()) return "Vui lòng nhập tiêu đề hoạt động.";
    if (!form.related_id) return "Vui lòng chọn đối tượng liên quan.";

    if (type === "meeting") {
      if (!form.start_at || !form.end_at) return "Vui lòng chọn thời gian bắt đầu và kết thúc.";
      if (new Date(form.start_at) < new Date()) return "Thời gian họp phải lớn hơn thời điểm hiện tại.";
      if (new Date(form.end_at) <= new Date(form.start_at)) return "Thời gian kết thúc phải sau thời gian bắt đầu.";
    }

    if (type === "task") {
      if (!form.due_at) return "Vui lòng chọn hạn xử lý công việc.";
      if (new Date(form.due_at) < new Date()) return "Hạn xử lý công việc phải lớn hơn thời điểm hiện tại.";
      if (form.reminder_at && new Date(form.reminder_at) > new Date(form.due_at)) {
        return "Thời gian nhắc nhở không được sau hạn xử lý.";
      }
    }

    if (type === "call" && (!form.call_from || !form.call_to)) return "Vui lòng nhập đủ số gọi từ và gọi đến.";
    if (type === "email" && (!form.email_from || !form.email_to)) return "Vui lòng nhập đủ email gửi và nhận.";

    return null;
  };

  const handleCreate = async () => {
    const validationMessage = validate();
    if (validationMessage) {
      toast.warning(validationMessage);
      return;
    }

    try {
      setSubmitting(true);
      const common = {
        subject: form.subject.trim(),
        related_type: form.related_type,
        related_id: Number(form.related_id),
        owner_id: user?.id || 1,
        notes: form.notes || null,
        priority: form.priority,
      };

      if (type === "call") {
        await createCallActivity({
          ...common,
          call_from: form.call_from,
          call_to: form.call_to,
          is_inbound: form.direction === "in",
        });
      } else if (type === "email") {
        await createEmailActivity({
          ...common,
          direction: form.direction,
          email_from: form.email_from,
          email_to: form.email_to,
        });
      } else if (type === "meeting") {
        await createMeetingActivity({
          ...common,
          start_at: new Date(form.start_at),
          end_at: new Date(form.end_at),
          location: form.location || null,
          attendees: form.attendees || null,
          meeting_link: form.meeting_link || null,
        });
      } else {
        await createTaskActivity({
          ...common,
          due_at: new Date(form.due_at),
          reminder_at: form.reminder_at ? new Date(form.reminder_at) : null,
        });
      }

      toast.success("Tạo hoạt động thành công.");
      setTimeout(() => navigate(-1), 600);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || "Không thể tạo hoạt động");
    } finally {
      setSubmitting(false);
    }
  };

  const minNow = toLocalDateTimeInput();

  return (
    <div className="page-container">
      <div className="erp-card mx-auto max-w-5xl overflow-hidden">
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="rounded-md p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
              aria-label="Quay lại"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-50">{getIcon(type)}</span>
            <div>
              <h1 className="text-base font-semibold text-gray-900">{getTitle(type)}</h1>
              <p className="text-xs text-gray-500">{getDescription(type)}</p>
            </div>
          </div>
        </div>

        <div className="space-y-6 p-5">


          <section className="space-y-4">
            <SectionTitle icon={<UserRound className="h-4 w-4" />} title="Đối tượng liên quan" />
            <div className="grid gap-4 md:grid-cols-[220px_1fr]">
              <div>
                <FieldLabel>Loại đối tượng</FieldLabel>
                <select className={inputClass} value={form.related_type} onChange={(event) => handleRelatedTypeChange(event.target.value as RelatedType)}>
                  <option value="lead">Khách hàng tiềm năng</option>
                  <option value="opportunity">Cơ hội kinh doanh</option>
                  <option value="customer">Khách hàng</option>
                </select>
              </div>
              <div>
                <FieldLabel required>Đối tượng</FieldLabel>
                <select className={inputClass} value={form.related_id} onChange={(event) => handleRelatedIdChange(event.target.value)} disabled={loading}>
                  <option value="">-- Chọn đối tượng --</option>
                  {relatedList.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                      {item.subtitle ? ` - ${item.subtitle}` : ""}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <RelatedPreview item={selectedRelated} />
          </section>

          <section className="space-y-4 border-t border-gray-100 pt-5">
            <SectionTitle icon={<Clock className="h-4 w-4" />} title="Thông tin hoạt động" />
            <div className="grid gap-4 md:grid-cols-2">
              <FormInput
                label="Tiêu đề"
                required
                value={form.subject}
                onChange={(value) => update("subject", value)}
                placeholder="VD: Gọi tư vấn gói ERP"
              />
              <div>
                <FieldLabel>Mức ưu tiên</FieldLabel>
                <select className={inputClass} value={form.priority} onChange={(event) => update("priority", event.target.value as Priority)}>
                  {PRIORITIES.map((priority) => (
                    <option key={priority.value} value={priority.value}>
                      {priority.label}
                    </option>
                  ))}
                </select>
              </div>

              {(type === "call" || type === "email") && (
                <div className="md:col-span-2">
                  <FieldLabel>{type === "call" ? "Loại cuộc gọi" : "Loại email"}</FieldLabel>
                  <div className="grid max-w-sm grid-cols-2 rounded-md bg-gray-100 p-1">
                    <button
                      type="button"
                      className={`rounded px-3 py-1.5 text-sm font-medium ${form.direction === "out" ? "bg-white text-orange-600 shadow-sm" : "text-gray-500"}`}
                      onClick={() => handleDirectionChange("out")}
                    >
                      Gửi đi
                    </button>
                    <button
                      type="button"
                      className={`rounded px-3 py-1.5 text-sm font-medium ${form.direction === "in" ? "bg-white text-orange-600 shadow-sm" : "text-gray-500"}`}
                      onClick={() => handleDirectionChange("in")}
                    >
                      Nhận vào
                    </button>
                  </div>
                </div>
              )}

              {type === "call" && (
                <>
                  <FormInput label="Gọi từ" required value={form.call_from} onChange={(value) => update("call_from", value)} />
                  <FormInput label="Gọi đến" required value={form.call_to} onChange={(value) => update("call_to", value)} />
                </>
              )}

              {type === "email" && (
                <>
                  <FormInput label="Email từ" required value={form.email_from} onChange={(value) => update("email_from", value)} />
                  <FormInput label="Email đến" required value={form.email_to} onChange={(value) => update("email_to", value)} />
                </>
              )}

              {type === "meeting" && (
                <>
                  <div>
                    <FieldLabel required>Thời gian bắt đầu</FieldLabel>
                    <input type="datetime-local" min={minNow} className={inputClass} value={form.start_at} onChange={(event) => update("start_at", event.target.value)} />
                  </div>
                  <div>
                    <FieldLabel required>Thời gian kết thúc</FieldLabel>
                    <input type="datetime-local" min={form.start_at || minNow} className={inputClass} value={form.end_at} onChange={(event) => update("end_at", event.target.value)} />
                  </div>
                  <FormInput label="Địa điểm" value={form.location} onChange={(value) => update("location", value)} icon={<MapPin className="h-4 w-4" />} />
                  <FormInput label="Link họp" value={form.meeting_link} onChange={(value) => update("meeting_link", value)} placeholder="https://meet.google.com/..." />
                  <div className="md:col-span-2">
                    <FormInput label="Người tham dự" value={form.attendees} onChange={(value) => update("attendees", value)} placeholder="Email hoặc tên người tham dự, cách nhau bằng dấu phẩy" />
                  </div>
                </>
              )}

              {type === "task" && (
                <>
                  <div>
                    <FieldLabel required>Hạn xử lý</FieldLabel>
                    <input type="datetime-local" min={minNow} className={inputClass} value={form.due_at} onChange={(event) => update("due_at", event.target.value)} />
                  </div>
                  <div>
                    <FieldLabel>Nhắc nhở</FieldLabel>
                    <input
                      type="datetime-local"
                      min={minNow}
                      max={form.due_at || undefined}
                      className={inputClass}
                      value={form.reminder_at}
                      onChange={(event) => update("reminder_at", event.target.value)}
                      disabled={!form.due_at}
                    />
                  </div>
                </>
              )}

              <div className="md:col-span-2">
                <FieldLabel>Ghi chú</FieldLabel>
                <textarea className={textareaClass} value={form.notes} onChange={(event) => update("notes", event.target.value)} placeholder="Nội dung trao đổi, kết quả mong muốn hoặc bước tiếp theo..." />
              </div>
            </div>
          </section>

          <div className="flex justify-end gap-3 border-t border-gray-100 pt-5">
            <Button variant="outline" onClick={() => navigate(-1)} disabled={submitting}>
              Hủy
            </Button>
            <Button onClick={handleCreate} disabled={loading || submitting}>
              {submitting ? "Đang tạo..." : getTitle(type)}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
