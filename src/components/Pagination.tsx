interface Props {
  page: number;
  perPage: number;
  total: number;
  onChange: (page: number) => void;
}

export function Pagination({ page, perPage, total, onChange }: Props) {
  const totalPages = Math.ceil(total / perPage);
  if (totalPages <= 1) return null;

  const pages: (number | "...")[] = [];
  const delta = 2;
  const left  = page - delta;
  const right = page + delta;

  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= left && i <= right)) {
      pages.push(i);
    } else if (i === left - 1 || i === right + 1) {
      pages.push("...");
    }
  }

  const btn = (label: string | number, target: number, disabled: boolean, active = false) => (
    <button
      key={`${label}-${target}`}
      onClick={() => !disabled && onChange(target)}
      disabled={disabled}
      className={[
        "min-w-[34px] h-[34px] flex items-center justify-center rounded-lg text-sm font-medium transition-all",
        active
          ? "bg-primary text-black font-bold"
          : disabled
          ? "text-faint cursor-not-allowed"
          : "text-muted bg-card border border-border hover:border-border-hi hover:text-[#e2e8f0]",
      ].join(" ")}
    >
      {label}
    </button>
  );

  return (
    <div className="flex items-center gap-1.5 flex-wrap justify-center mt-6">
      {btn("←", page - 1, page === 1)}
      {pages.map((p, i) =>
        p === "..." ? (
          <span key={`dots-${i}`} className="text-faint px-1">…</span>
        ) : (
          btn(p, p as number, false, p === page)
        )
      )}
      {btn("→", page + 1, page === totalPages)}
      <span className="text-xs text-muted ml-2">
        {((page - 1) * perPage) + 1}–{Math.min(page * perPage, total)} of {total.toLocaleString()}
      </span>
    </div>
  );
}
