"use client";
import { motion } from "framer-motion";

export default function FadeInWhenVisible({ children, delay = 0 }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay }}
            viewport={{ once: true, amount: 0.2 }}
        >
            {children}
        </motion.div>
    );
}
