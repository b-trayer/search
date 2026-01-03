import { TrendingUp, MousePointerClick, Eye, Clock } from "lucide-react";
import AnimatedCounter from "./AnimatedCounter";

interface StatsPanelProps {
  totalResults: number;
  avgCTR: number;
  impressions: number;
  avgTime: number;
  isVisible: boolean;
}

const StatsPanel = ({ totalResults, avgCTR, impressions, avgTime, isVisible }: StatsPanelProps) => {
  if (!isVisible) return null;

  const stats = [
    {
      icon: Eye,
      label: "Результатов",
      value: totalResults,
      suffix: "",
      decimals: 0,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      icon: MousePointerClick,
      label: "CTR",
      value: avgCTR,
      suffix: "%",
      decimals: 1,
      color: "text-green-600",
      bgColor: "bg-green-500/10",
    },
    {
      icon: TrendingUp,
      label: "Показов",
      value: impressions,
      suffix: "",
      decimals: 0,
      color: "text-blue-600",
      bgColor: "bg-blue-500/10",
    },
    {
      icon: Clock,
      label: "Ср. время",
      value: avgTime,
      suffix: "с",
      decimals: 1,
      color: "text-amber-600",
      bgColor: "bg-amber-500/10",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6 animate-slide-up">
      {stats.map((stat, index) => (
        <div
          key={stat.label}
          className="bg-card rounded-xl p-4 shadow-card border border-border/50 hover:shadow-soft transition-all duration-300 hover:-translate-y-0.5"
          style={{ animationDelay: `${index * 100}ms` }}
        >
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${stat.bgColor}`}>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
              <p className={`text-xl font-bold ${stat.color}`}>
                <AnimatedCounter
                  value={stat.value}
                  suffix={stat.suffix}
                  decimals={stat.decimals}
                  duration={1200}
                />
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default StatsPanel;
