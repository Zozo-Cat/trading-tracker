// app/_components/BottomCTA.tsx
"use client";

import Link from "next/link";
import { motion } from "framer-motion";

export default function BottomCTA() {
    return (
        <motion.section
            className="py-12 px-4 text-center"
            style={{ backgroundColor: "#1a1818", borderTop: "1px solid #333" }}
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
        >
            <div className="max-w-4xl mx-auto">
                <h2 className="text-2xl md:text-3xl font-bold mb-4" style={{ color: "#D4AF37" }}>
                    Klar til at tage din trading til næste niveau?
                </h2>
                <p className="text-gray-300 mb-6">
                    Opret en gratis konto og få adgang til værktøjerne, der hjælper dig med at tracke, analysere og forbedre dine trades.
                </p>
                <Link
                    href="/signup"
                    className="inline-block px-6 py-3 rounded-lg text-black font-semibold shadow hover:scale-105 transition-transform"
                    style={{ backgroundColor: "#89ff00" }}
                >
                    Opret gratis konto
                </Link>
            </div>
        </motion.section>
    );
}
