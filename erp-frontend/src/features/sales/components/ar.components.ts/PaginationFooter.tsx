interface PaginationFooterProps {
  totalItems: number;
  filteredItems: number;
  label?: string;
}

export default function PaginationFooter({
  totalItems,
  filteredItems,
  label = "items",
}: PaginationFooterProps) {
  return (
    <div className="bg-gray-50 border-t border-gray-200 px-6 py-4">
      <p className="text-sm text-gray-600">
        Showing{" "}
        <span className="font-semibold text-gray-800">{filteredItems}</span>{" "}
        out of{" "}
        <span className="font-semibold text-gray-800">{totalItems}</span>{" "}
        {label}
      </p>
    </div>
  );
}
