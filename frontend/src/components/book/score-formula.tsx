interface ScoreFormulaProps {
  logBm25: number;
  userContrib: number;
  ctrContrib: number;
  finalScore: number;
}

export const ScoreFormula = ({ logBm25, userContrib, ctrContrib, finalScore }: ScoreFormulaProps) => (
  <div className="pt-2 border-t border-border">
    <div className="grid grid-cols-[1fr_auto] gap-x-3">
      <span className="font-semibold">Final Score</span>
      <span className="text-right font-semibold text-primary">{finalScore.toFixed(3)}</span>
    </div>
    <div className="text-[10px] text-muted-foreground mt-1">
      {logBm25.toFixed(3)} + {userContrib.toFixed(3)} + {ctrContrib.toFixed(3)} = {finalScore.toFixed(3)}
    </div>
  </div>
);
