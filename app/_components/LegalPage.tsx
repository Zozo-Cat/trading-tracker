"use client";

import { usePrefs } from "@/lib/usePrefs";
import { formatDate } from "@/lib/format";

type Props = {
    title: string;
    updatedAt?: string | Date;
    children: React.ReactNode;
};

export default function LegalPage({ title, updatedAt, children }: Props) {
    const { prefs } = usePrefs();

    return (
        <article className="prose prose-invert max-w-none">
            <header className="mb-6">
                <h1 className="text-2xl font-semibold">{title}</h1>
                {updatedAt && (
                    <div className="text-sm text-yellow-200/70">
                        Opdateret: {formatDate(updatedAt, prefs)}
                    </div>
                )}
            </header>
            <div>{children}</div>
        </article>
    );
}
