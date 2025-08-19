// app/page.tsx
import HeroCarousel from "./_components/HeroCarousel";
import Features from "./_components/Features";
import TestimonialsSlider from "./_components/TestimonialsSlider";
import BottomCTA from "./_components/BottomCTA";
import LoginStatus from "@/app/_components/LoginStatus";

export default function Page() {
    return (
        <>
            {/* Login status badge øverst */}
            <LoginStatus />

            {/* Resten af forsiden */}
            <main className="pb-20">
                <HeroCarousel />
                <Features />
                <TestimonialsSlider />
                <BottomCTA />
            </main>
        </>
    );
}
