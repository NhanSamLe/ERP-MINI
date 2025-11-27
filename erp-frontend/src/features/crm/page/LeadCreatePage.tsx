import { useState } from "react";
import { useDispatch } from "react-redux";
import { AppDispatch } from "../../../store/store";
import { createLead } from "../store/lead/lead.thunks";
import { CreateLeadDto } from "../dto/lead.dto";
import { FormInput } from "../../../components/ui/FormInput";
import { Button } from "../../../components/ui/Button";
import { Alert } from "../../../components/ui/Alert";
import { ArrowLeft, User, Mail, Phone, Globe } from "lucide-react";

export default function LeadCreatePage() {
  const dispatch = useDispatch<AppDispatch>();

  const [form, setForm] = useState<CreateLeadDto>({
    name: "",
    email: "",
    phone: "",
    source: ""
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const sourceOptions = [
    { value: "", label: "Select source..." },
    { value: "Online Store", label: "Online Store" },
    { value: "Advertisement", label: "Advertisement" },
    { value: "Cold Call", label: "Cold Call" },
    { value: "Web Download", label: "Web Download" },
    { value: "External Referral", label: "External Referral" },
    { value: "Seminar Partner", label: "Seminar Partner" },
    { value: "Partner", label: "Partner" },
    { value: "Employee Referral", label: "Employee Referral" },
    { value: "Trade Show", label: "Trade Show" },
    { value: "Social Media", label: "Social Media" },
    { value: "Email Campaign", label: "Email Campaign" },
    { value: "Other", label: "Other" }
  ];

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!form.name.trim()) {
      newErrors.name = "Lead name is required";
    }

    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = "Invalid email format";
    }

    if (form.phone && !/^[0-9+\-\s()]+$/.test(form.phone)) {
      newErrors.phone = "Invalid phone format";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setIsSubmitting(true);
      const result = await dispatch(createLead(form)).unwrap();
      setAlert({ type: 'success', message: 'Lead created successfully!' });
      setTimeout(() => {
        // Navigate to lead detail page
        window.location.href = `/crm/lead/${result.id}`;
      }, 1500);
    } catch (error) {
      setAlert({type: 'error',
                message: (error as string) ||'Failed to create lead. Please try again.' });
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (form.name || form.email || form.phone || form.source) {
      if (window.confirm('You have unsaved changes. Are you sure you want to leave?')) {
        window.history.back();
      }
    } else {
      window.history.back();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-6">
        {/* Alert */}
        {alert && (
          <div className="mb-4">
            <Alert
              type={alert.type}
              message={alert.message}
              onClose={() => setAlert(null)}
            />
          </div>
        )}

        <div className="bg-white rounded-lg shadow-sm">
          {/* Header */}
          <div className="border-b border-gray-200 px-6 py-4">
            <div className="flex items-center gap-4">
              <button
                onClick={handleCancel}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-2xl font-semibold text-gray-900">Create New Lead</h1>
                <p className="text-sm text-gray-500 mt-1">
                  Add a new sales lead to your pipeline
                </p>
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="p-6">
            <div className="space-y-6">
              {/* Basic Information Section */}
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b">
                  Basic Information
                </h2>
                <div className="space-y-4">
                  <FormInput
                    label="Lead Name"
                    type="text"
                    value={form.name}
                    onChange={(value) => setForm({ ...form, name: value })}
                    placeholder="Enter lead name"
                    required
                    icon={<User className="w-5 h-5 text-gray-400" />}
                    error={errors.name}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormInput
                      label="Email"
                      type="email"
                      value={form.email || ""}
                      onChange={(value) => setForm({ ...form, email: value })}
                      placeholder="email@example.com"
                      icon={<Mail className="w-5 h-5 text-gray-400" />}
                      error={errors.email}
                    />

                    <FormInput
                      label="Phone"
                      type="tel"
                      value={form.phone || ""}
                      onChange={(value) => setForm({ ...form, phone: value })}
                      placeholder="+84 123 456 789"
                      icon={<Phone className="w-5 h-5 text-gray-400" />}
                      error={errors.phone}
                    />
                  </div>
                </div>
              </div>

              {/* Lead Source Section */}
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b">
                  Lead Source
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Source
                    </label>
                    <div className="relative">
                      <Globe className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                      <select
                        value={form.source || ""}
                        onChange={(e) => setForm({ ...form, source: e.target.value })}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-transparent outline-none"
                      >
                        {sourceOptions.map(option => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      How did this lead find you?
                    </p>
                  </div>
                </div>
              </div>

              {/* Information Note */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex gap-3">
                  <div className="flex-shrink-0">
                    <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-blue-900 mb-1">
                      What happens next?
                    </h3>
                    <p className="text-sm text-blue-700">
                      After creating this lead, you can add evaluation details, schedule activities, 
                      and track progress through the sales pipeline. The lead will start in "New" stage.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 mt-8 pt-6 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="primary"
                onClick={handleSubmit}
                loading={isSubmitting}
                disabled={isSubmitting}
              >
                Create Lead
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}