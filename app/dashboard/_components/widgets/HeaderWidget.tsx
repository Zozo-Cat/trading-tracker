"use client";
import DashboardCard from "../DashboardCard";

export default function HeaderWidget() {
    return (
        <DashboardCard title="Sektion" right={null}>
            <div className="h-full flex items-center">
                <h3 className="text-xl font-semibold" style={{ color: "#E9CC6A" }}>
                    Min sektionstitel
                </h3>
            </div>
        </DashboardCard>
    );
}
