export default function TagChip({ tag, state = "idle", size = "md", onClick }) {
    const pad = size === "sm" ? "px-2.5 py-1" : size === "md" ? "px-3 py-1.5" : "px-4 py-2"
    const font = size === "sm" ? "text-xs" : size === "md" ? "text-sm" : "text-base"

    const isActive = state === "active";
    const isSelected = state === "selected";
    const isNew = state === "new";

    const borderClass = (isActive || isSelected) ? "border-amber" : isNew ? "border-dashed border-line-hi-2" : "border-line-hi-2"
    const fillClass = isActive ? "bg-amber/50 text-dusk-danger"
        : isSelected ? "bg-amber/25 text-amber"
        : "bg-dusk-dim/8 text-dusk-mute"

    const insetShadow = isActive ? "shadow-amber-sm" : isSelected ? "shadow-amber-sm/40" : ""

    const hue = 30
    const dotColor = (state === "idle" || isNew) ? "rgb(108 107 105 / 0.45)" : isActive ? `hsl(${hue}, 80%, 60%)` : `hsl(${hue}, 60%, 60%)`

    const label = typeof tag === "string" ? tag : tag.label
    const count = typeof tag === "object" ? tag.count : undefined

    return (
        <button onClick={onClick} className={`justify-center border inline-flex items-center gap-1.5 whitespace-nowrap rounded-full font-sans font-medium tracking-wide transition-colors ${pad} ${font} ${borderClass} ${fillClass} ${insetShadow}`}>
             <span
                 style={{ background: dotColor }}
                 className="h-1.5 w-1.5 rounded-full shrink-0 self-center"
             />
            {label}
            {count !== undefined && <span className="text-dusk-dim text-[11px]">{count}</span>}
        </button>
    )
}