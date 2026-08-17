import { OnboardingWizard } from "@/components/onboarding/wizard";
import { requireSession } from "@/lib/auth/tenant";
import { redirect } from "next/navigation";

export default async function OnboardingPage() {
  const session = await requireSession();
  if (session.mandalId && session.onboardingCompleted) {
    redirect("/dashboard");
  }
  return <OnboardingWizard />;
}
