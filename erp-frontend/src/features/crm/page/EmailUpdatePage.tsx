// src/features/crm/pages/EmailUpdatePage.tsx
import { useEffect, useRef, useState, KeyboardEvent, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import {
  getActivityDetail,
  updateActivity,
  updateEmailDetail,
  sendEmailForActivity,
  sendEmailWithAttachments,
} from "../service/activity.service";
import { Activity } from "../dto/activity.dto";
import {
  ArrowLeft, Send, Save, X, ChevronDown,
  Loader2, CheckCircle2, Mail, Paperclip, Star,
  AlertTriangle, MoreHorizontal, FileText, Image, Film, Archive,
} from "lucide-react";
import TipTapEditor from "../components/TipTapEditor";

// ─── Email Tag Input ──────────────────────────────────────────────────────────
function EmailTagInput({
  label,
  tags,
  onAdd,
  onRemove,
  placeholder,
  autoFocus,
}: {
  label: string;
  tags: string[];
  onAdd: (email: string) => void;
  onRemove: (email: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
}) {
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const isValid = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

  const commit = () => {
    const v = input.trim();
    if (!v) return;
    if (isValid(v) && !tags.includes(v)) {
      onAdd(v);
      setInput("");
    } else if (!isValid(v)) {
      toast.error(`"${v}" không phải email hợp lệ`);
    } else {
      setInput("");
    }
  };

  const handleKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (["Enter", ",", " ", "Tab"].includes(e.key)) {
      e.preventDefault();
      commit();
    }
    if (e.key === "Backspace" && !input && tags.length) {
      onRemove(tags[tags.length - 1]);
    }
  };

  return (
    <div className="flex items-start gap-3 min-h-[40px]">
      <span className="w-9 text-right text-[13px] text-gray-500 font-medium pt-2 flex-shrink-0 select-none">
        {label}
      </span>
      <div
        className="flex flex-wrap gap-1.5 flex-1 py-1.5 cursor-text min-h-[36px]"
        onClick={() => inputRef.current?.focus()}
      >
        {tags.map(tag => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-full pl-3 pr-1.5 py-0.5 text-sm font-medium leading-none"
          >
            {tag}
            <button
              type="button"
              onClick={e => { e.stopPropagation(); onRemove(tag); }}
              className="w-4 h-4 flex items-center justify-center hover:bg-blue-200 rounded-full transition-colors"
            >
              <X className="w-2.5 h-2.5" />
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          autoFocus={autoFocus}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKey}
          onBlur={commit}
          placeholder={tags.length === 0 ? (placeholder ?? "") : ""}
          className="outline-none text-[13px] text-gray-800 placeholder-gray-400 flex-1 min-w-[160px] bg-transparent leading-none py-1"
        />
      </div>
    </div>
  );
}

// ─── Priority badge ───────────────────────────────────────────────────────────
const PRIORITY_CONFIG = {
  low:    { label: "Thấp",   color: "text-gray-500 bg-gray-100" },
  medium: { label: "Thường", color: "text-blue-600 bg-blue-50" },
  high:   { label: "Cao",    color: "text-red-600 bg-red-50" },
};

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function EmailUpdatePage() {
  const { id } = useParams();
  const activityId = Number(id);
  const navigate = useNavigate();

  const [detail, setDetail]   = useState<Activity | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [saving,  setSaving]  = useState(false);

  const [showCc,  setShowCc]  = useState(false);
  const [showBcc, setShowBcc] = useState(false);

  const [toTags,  setToTags]  = useState<string[]>([]);
  const [ccTags,  setCcTags]  = useState<string[]>([]);
  const [bccTags, setBccTags] = useState<string[]>([]);

  const [subject,     setSubject]     = useState("");
  const [htmlBody,    setHtmlBody]    = useState("");
  const [priority,    setPriority]    = useState<"low" | "medium" | "high">("medium");
  const [notes,       setNotes]       = useState("");
  const [sent,        setSent]        = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const htmlToText = (html: string) => {
    const tmp = document.createElement("div");
    tmp.innerHTML = html;
    return tmp.innerText;
  };

  // ── Load ───────────────────────────────────────────────────────────────────
  useEffect(() => { loadDetail(); }, [activityId]);

  const loadDetail = async () => {
    try {
      setLoading(true);
      const res = await getActivityDetail(activityId);
      setDetail(res);
      setSubject(res.email?.subject || res.subject || "");
      setPriority((res.priority as any) || "medium");
      setNotes(res.notes || "");
      setHtmlBody(res.email?.html_body || "");
      setSent(res.email?.status === "sent");

      if (res.email?.email_to) {
        setToTags(res.email.email_to.split(",").map((s: string) => s.trim()).filter(Boolean));
      }
      if (res.email?.cc) {
        setCcTags(res.email.cc.split(",").map((s: string) => s.trim()).filter(Boolean));
        setShowCc(true);
      }
      if (res.email?.bcc) {
        setBccTags(res.email.bcc.split(",").map((s: string) => s.trim()).filter(Boolean));
        setShowBcc(true);
      }
    } catch {
      toast.error("Không thể tải dữ liệu email");
    } finally {
      setLoading(false);
    }
  };

  const buildEmailPayload = () => ({
    activity_id: activityId,
    subject,
    email_to:   toTags.join(", ") || null,
    cc:         ccTags.join(", ") || null,
    bcc:        bccTags.join(", ") || null,
    html_body:  htmlBody || null,
    text_body:  htmlToText(htmlBody),
  });

  // ── Save draft ─────────────────────────────────────────────────────────────
  const handleSaveDraft = async () => {
    try {
      setSaving(true);
      await updateActivity({ activityId, subject, notes: notes || null, priority });
      await updateEmailDetail(activityId, buildEmailPayload());
      toast.success("Đã lưu bản nháp");
    } catch {
      toast.error("Không thể lưu bản nháp");
    } finally {
      setSaving(false);
    }
  };

  // ── File helpers ───────────────────────────────────────────────────────────
  const handleFilePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setAttachments(prev => {
      const names = new Set(prev.map(f => f.name));
      return [...prev, ...files.filter(f => !names.has(f.name))];
    });
    e.target.value = "";
  };

  const removeAttachment = useCallback((name: string) => {
    setAttachments(prev => prev.filter(f => f.name !== name));
  }, []);

  const formatBytes = (b: number) => {
    if (b < 1024) return `${b} B`;
    if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
    return `${(b / 1024 / 1024).toFixed(1)} MB`;
  };

  const fileIcon = (mime: string) => {
    if (mime.startsWith("image/")) return <Image className="w-3.5 h-3.5" />;
    if (mime.startsWith("video/")) return <Film className="w-3.5 h-3.5" />;
    if (mime.includes("zip") || mime.includes("rar") || mime.includes("7z")) return <Archive className="w-3.5 h-3.5" />;
    return <FileText className="w-3.5 h-3.5" />;
  };

  // ── Send ───────────────────────────────────────────────────────────────────
  const handleSend = async () => {
    if (toTags.length === 0) { toast.error("Nhập ít nhất một người nhận"); return; }
    if (!subject.trim())     { toast.error("Vui lòng nhập tiêu đề");        return; }
    try {
      setSending(true);
      await updateActivity({ activityId, subject, notes: notes || null, priority });
      await updateEmailDetail(activityId, buildEmailPayload());
      if (attachments.length > 0) {
        await sendEmailWithAttachments(activityId, attachments);
      } else {
        await sendEmailForActivity(activityId);
      }
      setSent(true);
      toast.success("Email đã được gửi!");
      setTimeout(() => navigate(-1), 1200);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Gửi email thất bại");
    } finally {
      setSending(false);
    }
  };

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-[#f6f8fc] flex items-center justify-center">
        <div className="flex items-center gap-3 text-gray-400">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm">Đang tải...</span>
        </div>
      </div>
    );
  }
  if (!detail?.email) {
    return (
      <div className="min-h-screen bg-[#f6f8fc] flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
            <AlertTriangle className="w-7 h-7 text-gray-400" />
          </div>
          <p className="text-gray-600 font-medium">Không tìm thấy email</p>
          <button onClick={() => navigate(-1)} className="text-sm text-blue-600 hover:underline">Quay lại</button>
        </div>
      </div>
    );
  }

  const priCfg = PRIORITY_CONFIG[priority];

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#f6f8fc] flex flex-col">

      {/* ── Top nav bar (Gmail-style) ─────────────────────────────────────── */}
      <header className="bg-white border-b border-gray-200 px-4 h-14 flex items-center gap-3 sticky top-0 z-30 shadow-sm">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-500"
          title="Quay lại"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center shadow-sm">
            <Mail className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900 leading-none">Soạn thư</p>
            <p className="text-xs text-gray-400 mt-0.5 leading-none">
              {detail.email.email_from || "Hệ thống ERP"}
            </p>
          </div>
        </div>

        <div className="flex-1" />

        {/* Status chip */}
        {sent ? (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-medium">
            <CheckCircle2 className="w-3.5 h-3.5" /> Đã gửi
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border border-gray-200 bg-gray-50 text-gray-500">
            Bản nháp
          </span>
        )}

        {/* Priority */}
        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${priCfg.color}`}>
          <Star className="w-3 h-3" />
          {priCfg.label}
        </span>
      </header>

      {/* ── Main compose area ─────────────────────────────────────────────── */}
      <main className="flex-1 flex justify-center px-4 py-6">
        <div className="w-full max-w-3xl">

          {/* Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">

            {/* ── Recipients block ──────────────────────────────────────── */}
            <div className="divide-y divide-gray-100">

              {/* To */}
              <div className="px-5 py-2">
                <div className="flex items-start gap-0">
                  <div className="flex-1">
                    <EmailTagInput
                      label="Đến"
                      tags={toTags}
                      onAdd={e => setToTags(p => [...p, e])}
                      onRemove={e => setToTags(p => p.filter(t => t !== e))}
                      placeholder="Người nhận..."
                      autoFocus
                    />
                  </div>
                  <div className="flex items-center gap-0.5 pt-2 flex-shrink-0">
                    {!showCc && (
                      <button
                        type="button"
                        onClick={() => setShowCc(true)}
                        className="text-[12px] text-gray-400 hover:text-blue-600 hover:bg-blue-50 px-2 py-1 rounded-lg transition-colors font-medium"
                      >
                        CC
                      </button>
                    )}
                    {!showBcc && (
                      <button
                        type="button"
                        onClick={() => setShowBcc(true)}
                        className="text-[12px] text-gray-400 hover:text-blue-600 hover:bg-blue-50 px-2 py-1 rounded-lg transition-colors font-medium"
                      >
                        BCC
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* CC */}
              {showCc && (
                <div className="px-5 py-2 flex items-start gap-2">
                  <div className="flex-1">
                    <EmailTagInput
                      label="CC"
                      tags={ccTags}
                      onAdd={e => setCcTags(p => [...p, e])}
                      onRemove={e => setCcTags(p => p.filter(t => t !== e))}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => { setShowCc(false); setCcTags([]); }}
                    className="pt-2 p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* BCC */}
              {showBcc && (
                <div className="px-5 py-2 flex items-start gap-2">
                  <div className="flex-1">
                    <EmailTagInput
                      label="BCC"
                      tags={bccTags}
                      onAdd={e => setBccTags(p => [...p, e])}
                      onRemove={e => setBccTags(p => p.filter(t => t !== e))}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => { setShowBcc(false); setBccTags([]); }}
                    className="pt-2 p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Subject */}
              <div className="px-5 py-3">
                <input
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  placeholder="Tiêu đề"
                  className="w-full text-base font-medium text-gray-800 placeholder-gray-300 outline-none bg-transparent"
                />
              </div>
            </div>

            {/* ── Rich text body ─────────────────────────────────────────── */}
            <div className="border-t border-gray-100">
              <TipTapEditor
                value={htmlBody}
                onChange={setHtmlBody}
                minHeight={380}
              />
            </div>

            {/* ── Attachment list ────────────────────────────────────────── */}
            {attachments.length > 0 && (
              <div className="border-t border-gray-100 px-4 py-2.5 flex flex-wrap gap-2">
                {attachments.map(file => (
                  <div
                    key={file.name}
                    className="inline-flex items-center gap-2 bg-gray-100 hover:bg-gray-150 border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-gray-700 group transition-colors"
                  >
                    <span className="text-gray-400">{fileIcon(file.type)}</span>
                    <span className="max-w-[160px] truncate font-medium">{file.name}</span>
                    <span className="text-xs text-gray-400 flex-shrink-0">{formatBytes(file.size)}</span>
                    <button
                      type="button"
                      onClick={() => removeAttachment(file.name)}
                      className="ml-0.5 text-gray-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={handleFilePick}
            />

            {/* ── Footer actions ─────────────────────────────────────────── */}
            <div className="px-4 py-3 border-t border-gray-100 bg-gray-50 flex items-center justify-between gap-3 rounded-b-2xl">

              {/* Left: Send + Draft + Attach */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSend}
                  disabled={sending || sent}
                  className="inline-flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-semibold rounded-full shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {sending
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : sent
                    ? <CheckCircle2 className="w-4 h-4" />
                    : <Send className="w-4 h-4" />}
                  {sent ? "Đã gửi" : sending ? "Đang gửi..." : "Gửi"}
                </button>

                <button
                  type="button"
                  onClick={handleSaveDraft}
                  disabled={saving || sent}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-[13px] text-gray-600 font-medium hover:bg-gray-200 rounded-full transition-colors disabled:opacity-50"
                >
                  {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  Lưu nháp
                </button>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={sent}
                  className={`relative inline-flex items-center gap-1.5 p-2 rounded-full transition-colors disabled:opacity-50 ${
                    attachments.length > 0
                      ? "text-blue-600 bg-blue-50 hover:bg-blue-100"
                      : "text-gray-400 hover:text-gray-600 hover:bg-gray-200"
                  }`}
                  title="Đính kèm tệp"
                >
                  <Paperclip className="w-4 h-4" />
                  {attachments.length > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-blue-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none">
                      {attachments.length}
                    </span>
                  )}
                </button>
              </div>

              {/* Right: Priority select + More options */}
              <div className="flex items-center gap-2">
                <select
                  value={priority}
                  onChange={e => setPriority(e.target.value as any)}
                  className={`text-xs font-medium border rounded-full px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-colors cursor-pointer ${priCfg.color} border-current/20`}
                >
                  <option value="low">Thấp</option>
                  <option value="medium">Thường</option>
                  <option value="high">Ưu tiên cao</option>
                </select>

                <button
                  type="button"
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-full transition-colors"
                  title="Thêm tuỳ chọn"
                >
                  <MoreHorizontal className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* ── Metadata card (collapsed by default) ────────────────────── */}
          <details className="group mt-3">
            <summary className="cursor-pointer list-none flex items-center gap-2 px-4 py-2 text-xs text-gray-400 hover:text-gray-600 select-none">
              <ChevronDown className="w-3.5 h-3.5 group-open:rotate-180 transition-transform duration-200" />
              Thông tin kỹ thuật
            </summary>
            <div className="mt-1 bg-white rounded-xl border border-gray-200 shadow-sm p-4">
              <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-xs text-gray-500">
                <div>
                  <span className="font-medium text-gray-700">Chiều gửi:</span>{" "}
                  {detail.email?.direction === "out" ? "Gửi đi" : detail.email?.direction === "in" ? "Nhận vào" : "—"}
                </div>
                <div><span className="font-medium text-gray-700">Từ:</span> {detail.email?.email_from || "—"}</div>
                <div>
                  <span className="font-medium text-gray-700">Trạng thái:</span>{" "}
                  {detail.email?.status === "sent" ? "Đã gửi" : "Bản nháp"}
                </div>
                <div><span className="font-medium text-gray-700">Gửi qua:</span> {detail.email?.sent_via || "—"}</div>
                {detail.email?.message_id && (
                  <div className="col-span-2">
                    <span className="font-medium text-gray-700">Message-ID:</span>{" "}
                    <span className="font-mono text-gray-500">{detail.email.message_id}</span>
                  </div>
                )}
                {detail.email?.error_message && (
                  <div className="col-span-2 text-red-500">
                    <span className="font-medium">Lỗi:</span> {detail.email.error_message}
                  </div>
                )}
              </div>

              {/* Notes field */}
              <div className="mt-4 pt-3 border-t border-gray-100">
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Ghi chú nội bộ</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Ghi chú cho nhóm (không gửi cho khách)..."
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-700 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none bg-gray-50"
                />
              </div>
            </div>
          </details>
        </div>
      </main>
    </div>
  );
}
