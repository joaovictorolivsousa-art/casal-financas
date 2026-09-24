import { ProfileGate } from "@/components/ProfileGate";

/** Todas as telas do dashboard exigem um perfil escolhido (no lugar do antigo login). */
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <ProfileGate>{children}</ProfileGate>;
}
