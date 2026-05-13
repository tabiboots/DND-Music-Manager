import D20 from './d20.jsx';
export default function Brand({ light = false }) {
    return (
        <div className = "inline-flex items-center gap-2.5">
            <D20 size = {18}/>
            <span className={`font-display text-base italic tracking-wide
                            ${light ? 'text-white' : 'text-dusk-fg'}`}>
                DnD Music Manager
            </span>
        </div>
    )
}