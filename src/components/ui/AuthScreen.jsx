import Brand from "./wordmark.jsx";
import SpotifyLinkButton from "./SpotifyLinkButton.jsx";
import TagChip from "./TagChip.jsx";
import StarField from "./StarField.jsx";


const tags = [
    { id: 1, label: 'combat', state: "selected"},
    { id: 2, label: 'tavern', state: "selected"},
    { id: 3, label: 'dread', state: "idle"},
    { id: 4, label: 'victory', state: "selected"},
    { id: 5, label: 'travel', state: "idle"},
    { id: 6, label: 'exploration', state: "idle"},
    { id: 7, label: 'boss', state: "selected"},
    { id: 8, label: 'city', state: "idle"},
    { id: 9, label: 'heist', state: "idle"},
    { id: 10, label: 'dungeon', state: "idle"},
    { id: 11, label: 'elvish', state: "selected"},
    { id: 12, label: 'downtime', state: "idle"},
    { id: 13, label: 'rest', state: "idle"},
    { id: 14, label: '+ new tag', state: "new"},
]

export default function AuthScreen() {
    return (
        <div className="grid grid-cols-2 h-screen bg-dusk-900">
            <div className="relative flex flex-col justify-between p-14
                      border-r border-line
                      bg-gradient-to-br from-dusk-800 to-dusk-900">
                <StarField />           {/* absolute-positioned, fills column */}
                <Brand />               {/* top */}

                <div>                   {/* middle */}
                    <h1 className="font-display text-5xl font-medium leading-tight
                          text-dusk-fg tracking-tight mr-20">
                        Background music that{" "}
                        <em className="text-amber-soft italic">reads&nbsp;the&nbsp;room</em>.
                    </h1>
                    <p className="mt-5 text-dusk-mute text-[13px] leading-relaxed max-w-sm">
                        Never loop the same combat song four times. Never accidentally scare the party with boss music. Tag your library once and queue by feel.
                    </p>
                    <div className="flex flex-wrap gap-2 mt-6">
                        {tags.map(tag => <TagChip key={tag.id} tag={tag} state={tag.state}/>)}
                    </div>
                </div>

                <span className="text-dusk-dim text-xs uppercase tracking-widest">
          v0.0 · built for dungeon masters
                </span>
            </div>
            <div className="flex flex-col items-left justify-center p-14 bg-dusk-900 mr-15 gap-9 ml-15">
                <div className="flex flex-col gap-9">
                    <h1 className="font-display text-4xl font-medium leading-tight
                          text-dusk-fg tracking-tight">
                        Connect your{" "}
                        <em className="text-amber-soft italic">Spotify&nbsp;</em> <br />to begin.
                    </h1>
                    <h3 className="text-xs text-dusk-dim">We use your library to read tracks & playlists, and control playback
                        <br />on your active device. Nothing is shared.
                    </h3>
                    <ul className="list-none flex flex-col gap-2 text-dusk-dim">
                        <li className="flex items-center gap-2 text-sm">
                            <span className="h-1.5 w-1.5 rounded-full bg-amber shrink-0" />
                            Read saved tracks & playlists
                        </li>
                        <li className="flex items-center gap-2 text-sm">
                            <span className="h-1.5 w-1.5 rounded-full bg-amber shrink-0" />
                            Queue and control playback
                        </li>
                    </ul>
                </div>
                <SpotifyLinkButton />
            </div>
        </div>

    )
}