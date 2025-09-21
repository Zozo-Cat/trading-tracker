"use client";

type Props = {
    text: string;
    side?: "top" | "bottom" | "left" | "right";
};

export default function HelpTip({ text, side = "top" }: Props) {
    // wrapper = lille "?"-badge med egen group, så tooltip kun åbner på dette ikon
    return (
        <span className="relative inline-block group/select">
      <span
          aria-label="Hjælp"
          className="inline-flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold bg-neutral-700 text-white select-none"
          role="img"
      >
        ?
      </span>
      <span
          role="tooltip"
          className="pointer-events-none invisible opacity-0 group-hover/select:visible group-hover/select:opacity-100 transition
                   absolute z-20 whitespace-pre-line text-xs text-neutral-100 bg-neutral-900 border border-neutral-700 rounded-md px-2 py-1 shadow-lg"
          style={getPosStyle(side)}
      >
        {text}
      </span>
    </span>
    );
}

function getPosStyle(side: "top" | "bottom" | "left" | "right") {
    switch (side) {
        case "bottom":
            return { top: "130%", left: "50%", transform: "translateX(-50%)" } as const;
        case "left":
            return { right: "130%", top: "50%", transform: "translateY(-50%)" } as const;
        case "right":
            return { left: "130%", top: "50%", transform: "translateY(-50%)" } as const;
        case "top":
        default:
            return { bottom: "130%", left: "50%", transform: "translateX(-50%)" } as const;
    }
}
