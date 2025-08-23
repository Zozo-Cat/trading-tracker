// app/not-found.tsx
import Link from "next/link";

export default function NotFound() {
    return (
        <main className="min-h-[70vh] bg-[#211d1d] text-[#D4AF37] flex items-center justify-center px-4">
            <div className="max-w-lg w-full text-center">
                <h1 className="text-3xl font-bold mb-2">Siden blev ikke fundet</h1>
                <p className="text-gray-300 mb-6">
                    Siden du leder efter findes ikke — eller er flyttet.
                </p>
                <Link
                    href="/"
                    className="inline-block px-4 py-2 rounded-lg text-black font-medium"
                    style={{ backgroundColor: "#76ED77" }}
                >
                    Til forsiden
                </Link>
            </div>
        </main>
    );
}
