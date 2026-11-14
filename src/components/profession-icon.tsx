import { Scissors, Briefcase, Calculator, Code, Compass, Handshake, Heart, Home, Landmark, Megaphone, Ruler, Shield, User, Users, type LucideIcon } from "lucide-react";

const map: Record<string, LucideIcon> = {
  calculator: Calculator, compass: Compass, handshake: Handshake, landmark: Landmark, shield: Shield, home: Home,
  ruler: Ruler, megaphone: Megaphone, code: Code, user: User, users: Users, heart: Heart, briefcase: Briefcase, scissors: Scissors,
};
export function ProfessionIcon({ name, className }: { name: string; className?: string }) {
  const Icon = map[name] ?? Briefcase;
  return <Icon className={className} aria-hidden />;
}
