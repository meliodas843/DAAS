import {
  Download
} from "lucide-react";

export default function ExcelDownloadButton({
  onClick,
  title = "Excel татах"
}) {
  return (
    <button
      type="button"
      className="chart-excel-button"
      onClick={onClick}
      title={title}
      aria-label={title}
    >
      <Download
        size={16}
        strokeWidth={2}
      />
    </button>
  );
}