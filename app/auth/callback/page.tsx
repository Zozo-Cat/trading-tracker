// app/auth/callback/page.tsx
import CallbackClient from "./Client";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function Page() {
    return <CallbackClient />;
}
