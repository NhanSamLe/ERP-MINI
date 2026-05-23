/**
 * Purchase Module Design System Colors
 * Centralized color palette for consistent UI/UX across all purchase pages
 */

export const PURCHASE_COLORS = {
  // Primary brand colors
  primary: {
    50: "bg-orange-50",
    100: "bg-orange-100",
    200: "bg-orange-200",
    300: "bg-orange-300",
    400: "bg-orange-400",
    500: "bg-orange-500",
    600: "bg-orange-600",
    700: "bg-orange-700",
  },

  // Status colors
  status: {
    draft: "bg-gray-100 text-gray-700",
    pending: "bg-amber-50 text-amber-700",
    waiting_approval: "bg-orange-50 text-orange-700",
    approved: "bg-emerald-50 text-emerald-700",
    confirmed: "bg-teal-50 text-teal-700",
    completed: "bg-green-50 text-green-700",
    cancelled: "bg-red-50 text-red-700",
    rejected: "bg-red-50 text-red-700",
  },

  // Accent colors for cards
  accent: {
    orange: "bg-orange-50 border-orange-200",
    purple: "bg-purple-50 border-purple-200",
    green: "bg-emerald-50 border-emerald-200",
    red: "bg-red-50 border-red-200",
    blue: "bg-blue-50 border-blue-200",
    amber: "bg-amber-50 border-amber-200",
    teal: "bg-teal-50 border-teal-200",
  },

  // Text colors
  text: {
    primary: "text-gray-900",
    secondary: "text-gray-600",
    tertiary: "text-gray-500",
    muted: "text-gray-400",
  },

  // Border colors
  border: {
    light: "border-gray-200",
    medium: "border-gray-300",
    dark: "border-gray-400",
    orange: "border-orange-200",
    orangeAccent: "border-l-4 border-l-orange-400",
  },

  // Background colors
  bg: {
    page: "bg-gray-50",
    card: "bg-white",
    hover: "hover:bg-gray-50",
    hoverOrange: "hover:bg-orange-50",
  },

  // Gradient colors
  gradient: {
    header: "from-orange-50/40 to-white",
    headerDark: "from-orange-100/30 to-orange-50/10",
  },

  // Icon colors
  icon: {
    orange: "text-orange-500",
    blue: "text-blue-500",
    green: "text-emerald-500",
    red: "text-red-500",
    amber: "text-amber-500",
    purple: "text-purple-500",
    teal: "text-teal-500",
  },
};

// Tailwind class helpers
export const purchaseColorClasses = {
  pageContainer: "min-h-screen bg-gray-50",
  cardContainer: "bg-white rounded-xl border border-gray-200 shadow-sm",
  headerBar:
    "sticky top-0 z-20 bg-white border-b border-gray-200 shadow-sm border-t-2 border-t-orange-500",
  tableHeader: "bg-orange-50/60 border-orange-100",
  tableRowHover: "hover:bg-orange-50/40 transition-colors",
  filterPanel: "border-l-4 border-l-orange-400",
  cardHeader: "bg-gradient-to-r from-orange-50/40 to-white",
  standardFormLayout: "border-t-2 border-t-orange-500",
};
