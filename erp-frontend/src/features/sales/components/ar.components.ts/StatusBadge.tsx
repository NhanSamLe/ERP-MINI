import {
  StatusBadge as CommonStatusBadge,
  STATUS_COLORS,
  APPROVAL_COLORS,
} from "../../../../components/common/StatusBadge";

interface Props {
  status: string;
  type?: "status" | "approval";
  variant?: "status" | "approval";
  className?: string;
}

export function StatusBadge({
  status,
  type,
  variant,
  className,
}: Props) {
  return (
    <CommonStatusBadge
      status={status}
      variant={variant ?? type ?? "status"}
      className={className}
    />
  );
}

export { STATUS_COLORS, APPROVAL_COLORS };
export default StatusBadge;
