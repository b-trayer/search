import { ChevronDown, ChevronUp } from "lucide-react";
import { ScorePersonalization } from "./score-personalization";
import { ScoreCtr } from "./score-ctr";
import { ScoreFormula } from "./score-formula";

interface ScoreDetailsProps {
  isOpen: boolean;
  onToggle: (e: React.MouseEvent) => void;
  finalScore: number;
  logBm25: number;
  userContrib: number;
  ctrContrib: number;
  fType: number;
  fTopic: number;
  fUser: number;
  ctrFactor: number;
  smoothedCtr?: number;
  weights?: { w_user: number; alpha_type: number; alpha_topic: number; beta_ctr: number };
}

const ScoreDetails = ({
  isOpen, onToggle, finalScore, logBm25, userContrib, ctrContrib,
  fType, fTopic, fUser, ctrFactor, smoothedCtr = 0, weights,
}: ScoreDetailsProps) => {
  const w = weights || { w_user: 1.5, alpha_type: 0.4, alpha_topic: 0.6, beta_ctr: 0.5 };

  return (
    <>
      <div className="flex items-center justify-between">
        <button onClick={onToggle} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
          Score: {finalScore.toFixed(2)}
          {isOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        </button>
      </div>

      {isOpen && (
        <div className="p-3 bg-muted/50 rounded-lg text-xs font-mono space-y-3" onClick={(e) => e.stopPropagation()}>
          <div className="text-muted-foreground text-center pb-2 border-b border-border/50">
            score = log(1+BM25) + w<sub>u</sub>·f(U,D) + β·log(1+CTR)
          </div>
          <div className="space-y-3">
            <div className="grid grid-cols-[1fr_auto] gap-x-3 gap-y-0.5">
              <span className="text-muted-foreground">log(1+BM25)</span>
              <span className="text-right font-medium">{logBm25.toFixed(3)}</span>
            </div>
            <ScorePersonalization fType={fType} fTopic={fTopic} fUser={fUser} userContrib={userContrib} weights={w} />
            <ScoreCtr smoothedCtr={smoothedCtr} ctrFactor={ctrFactor} ctrContrib={ctrContrib} betaCtr={w.beta_ctr} />
            <ScoreFormula logBm25={logBm25} userContrib={userContrib} ctrContrib={ctrContrib} finalScore={finalScore} />
          </div>
        </div>
      )}
    </>
  );
};

export default ScoreDetails;
