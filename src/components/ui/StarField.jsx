import { useMemo } from "react";

export default function StarField({ density = 1 }) {
    const stars = useMemo(() => {
        const count = Math.round(60 * density)
        let seed = 19

        const rand = () => {
            seed = (seed * 9301 + 49297) % 233280
            return seed / 233280
        }

        return Array.from({ length: count }, () => ({
            x:       rand() * 100,        // percentage position
            y:       rand() * 100,
            size:    0.4 + rand() * 1.4,  // px
            opacity: 0.15 + rand() * 0.35,
        }))
    }, [density])  // only recalculate if density prop changes

    return (
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
            {stars.map((s, i) => (
                <span key={i} className="absolute rounded-full bg-dusk-fg"
                      style={{ left: `${s.x}%`, top: `${s.y}%`,
                          width: s.size, height: s.size, opacity: s.opacity }} />
            ))}
        </div>
    )
}