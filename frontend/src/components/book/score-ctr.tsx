interface ScoreCtrProps {
  smoothedCtr: number;
  ctrFactor: number;
  ctrContrib: number;
  betaCtr: number;
}

export const ScoreCtr = ({ smoothedCtr, ctrFactor, ctrContrib, betaCtr }: ScoreCtrProps) => (
  <div className="pl-2 border-l-2 border-orange-500/30 space-y-1">
    <div className="text-muted-foreground text-[10px] uppercase tracking-wide mb-1">
      CTR компонент
    </div>
    <div className="grid grid-cols-[1fr_auto] gap-x-3 gap-y-0.5 text-muted-foreground">
      <span>smoothed_CTR</span>
      <span className="text-right">{smoothedCtr.toFixed(4)}</span>
      <span>log(1 + CTR×10)</span>
      <span className="text-right">{ctrFactor.toFixed(3)}</span>
      <span className="col-span-2 border-t border-border/30 my-1"></span>
      <span>β × log(1+CTR) = {betaCtr} × {ctrFactor.toFixed(3)}</span>
      <span className="text-right font-medium text-foreground">{ctrContrib.toFixed(3)}</span>
    </div>
  </div>
);
