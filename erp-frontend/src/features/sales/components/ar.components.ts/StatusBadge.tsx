/**
 * StatusBadge — re-exported from the global common component.
 * Kept here for backward-compat with existing sales imports.
 *
 * The old `type` prop ("status" | "approval") is mapped to the common
 * component's `variant` prop automatically via the named re-export below.
 */
export {
  StatusBadge,
  STATUS_COLORS,
  APPROVAL_COLORS,
} from "../../../../components/common/StatusBadge";

export { StatusBadge as default } from "../../../../components/common/StatusBadge";
