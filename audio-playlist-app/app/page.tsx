import { loadDashboardData } from "./actions";
import { getSession } from "@/lib/auth";
import { LoginForm } from "@/components/dashboard/LoginForm";
import { DashboardClient } from "@/components/dashboard/DashboardClient";

export default async function HomePage() {
  const session = getSession();

  if (!session) {
    return <LoginForm />;
  }

  const result = await loadDashboardData();

  if (!result.success || !result.data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-slate-50 via-white to-slate-100 text-slate-500">
        <div className="space-y-3 text-center">
          <p className="text-lg font-semibold text-slate-800">We hit a snag loading your dashboard.</p>
          <p className="text-sm">{result.error ?? "Try refreshing the page or check your Supabase credentials."}</p>
        </div>
      </div>
    );
  }

  return <DashboardClient initialData={result.data} username={session.username} />;
}
