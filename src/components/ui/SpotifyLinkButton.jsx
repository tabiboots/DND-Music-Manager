export default function SpotifyLinkButton({ children = "Continue with Spotify", loading = false, onClick}) {
    return (
        <button
            onClick={onClick}
            disabled={loading}
            className={`w-full inline-flex items-center justify-center gap-3 
            rounded-full bg-amber font-sans font-semibold text-[#1a1208]
            px-5 py-3.5 text-[15px] transition-opacity 
            ${loading ? "cursor-wait opacity-90" : "cursor-pointer"}`}
        >
            {loading ? (
                <span className="h-5 w-5 rounded-full border-2 border-[#1a1208]/40
                border-t-[#1a1208] animate-spin" />
            ) : (
                <span className="h-5 w-5 rounded-full bg-[#1a1208] flex items-center justify-center">
                    <span className="h-1.75 w-1.75 rounded-full border-[1.6px] border-amber" />
                </span>
            )}
            {loading ? "" : "Connect your Spotify"}
        </button>
    )
}