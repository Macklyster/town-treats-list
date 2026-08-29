import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Target } from "lucide-react";
import type { LoyaltyMission } from "@/lib/loyalty-api";

const PERIOD_LABELS: Record<string, string> = {
  week: "Esta semana",
  month: "Este mês",
  once: "Única",
};

export function MissionList({ missions }: { missions: LoyaltyMission[] }) {
  if (!missions.length) {
    return (
      <p className="text-sm text-muted-foreground">
        Esta loja ainda não publicou missões. Volte em breve.
      </p>
    );
  }
  return (
    <ul className="space-y-4">
      {missions.map((m) => {
        const pct = Math.min(100, Math.round((m.progress / Math.max(1, m.goal_count)) * 100));
        const done = !!m.completed_at;
        return (
          <li key={m.id} className="space-y-2 rounded-lg border p-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-2">
                {done ? (
                  <CheckCircle2 className="mt-0.5 h-4 w-4 text-primary" />
                ) : (
                  <Target className="mt-0.5 h-4 w-4 text-muted-foreground" />
                )}
                <div>
                  <p className="text-sm font-medium">{m.title}</p>
                  {m.description && (
                    <p className="text-xs text-muted-foreground">{m.description}</p>
                  )}
                </div>
              </div>
              <div className="whitespace-nowrap text-right text-xs">
                <div className="font-semibold text-primary">+{m.reward_points} pts</div>
                <div className="text-muted-foreground">{PERIOD_LABELS[m.period] ?? m.period}</div>
              </div>
            </div>
            <Progress value={pct} className="h-1.5" />
            <p className="text-xs text-muted-foreground">
              {done ? "Concluída" : `${m.progress}/${m.goal_count}`}
            </p>
          </li>
        );
      })}
    </ul>
  );
}
