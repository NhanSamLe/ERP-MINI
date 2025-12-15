import Swal from "sweetalert2";

export function confirmAction(
  title: string,
  text: string
): Promise<boolean> {
  return Swal.fire({
    title,
    text,
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#f97316",
    cancelButtonColor: "#9ca3af",
    confirmButtonText: "Xác nhận",
    cancelButtonText: "Hủy",
    reverseButtons: true,
  }).then((result) => result.isConfirmed);
}
