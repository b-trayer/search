import { ChevronDown, ChevronUp } from "lucide-react";

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
  weights?: {
    w_user: number;
    alpha_type: number;
    alpha_topic: number;
    beta_ctr: number;
  };
}

const ScoreDetails = ({
  isOpen,
  onToggle,
  finalScore,
  logBm25,
  userContrib,
  ctrContrib,
  fType,
  fTopic,
  fUser,
  ctrFactor,
  smoothedCtr = 0,
  weights,
}: ScoreDetailsProps) => {
  const w = weights || { w_user: 1.5, alpha_type: 0.4, alpha_topic: 0.6, beta_ctr: 0.5 };

  const alphaFType = w.alpha_type * fType;
  const alphaFTopic = w.alpha_topic * fTopic;

  return (
    <>
      <div className="flex items-center justify-between">
        <button
          onClick={onToggle}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          Score: {finalScore.toFixed(2)}
          {isOpen ? (
            <ChevronUp className="h-3 w-3" />
          ) : (
            <ChevronDown className="h-3 w-3" />
          )}
        </button>
      </div>

      {isOpen && (
        <div
          className="p-3 bg-muted/50 rounded-lg text-xs font-mono space-y-3"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="text-muted-foreground text-center pb-2 border-b border-border/50">
            score = log(1+BM25) + w<sub>u</sub>·f(U,D) + β·log(1+CTR)
          </div>

          <div className="space-y-3">
            <div className="grid grid-cols-[1fr_auto] gap-x-3 gap-y-0.5">
              <span className="text-muted-foreground">log(1+BM25)</span>
              <span className="text-right font-medium">{logBm25.toFixed(3)}</span>
            </div>

            <div className="pl-2 border-l-2 border-primary/30 space-y-1">
              <div className="text-muted-foreground text-[10px] uppercase tracking-wide mb-1">
                Персонализация f(U,D)
              </div>
              <div className="grid grid-cols-[1fr_auto] gap-x-3 gap-y-0.5 text-muted-foreground">
                <span>f_type (raw)</span>
                <span className="text-right">{fType.toFixed(3)}</span>

                <span>f_topic (raw)</span>
                <span className="text-right">{fTopic.toFixed(3)}</span>

                <span className="col-span-2 border-t border-border/30 my-1"></span>

                <span>α₁ × f_type = {w.alpha_type} × {fType.toFixed(3)}</span>
                <span className="text-right">{alphaFType.toFixed(3)}</span>

                <span>α₂ × f_topic = {w.alpha_topic} × {fTopic.toFixed(3)}</span>
                <span className="text-right">{alphaFTopic.toFixed(3)}</span>

                <span className="col-span-2 border-t border-border/30 my-1"></span>

                <span>f(U,D) = α₁·f_type + α₂·f_topic</span>
                <span className="text-right font-medium text-foreground">{fUser.toFixed(3)}</span>

                <span>w<sub>u</sub> × f(U,D) = {w.w_user} × {fUser.toFixed(3)}</span>
                <span className="text-right font-medium text-foreground">{userContrib.toFixed(3)}</span>
              </div>
            </div>

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

                <span>β × log(1+CTR) = {w.beta_ctr} × {ctrFactor.toFixed(3)}</span>
                <span className="text-right font-medium text-foreground">{ctrContrib.toFixed(3)}</span>
              </div>
            </div>

            <div className="pt-2 border-t border-border">
              <div className="grid grid-cols-[1fr_auto] gap-x-3">
                <span className="font-semibold">Final Score</span>
                <span className="text-right font-semibold text-primary">{finalScore.toFixed(3)}</span>
              </div>
              <div className="text-[10px] text-muted-foreground mt-1">
                {logBm25.toFixed(3)} + {userContrib.toFixed(3)} + {ctrContrib.toFixed(3)} = {finalScore.toFixed(3)}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ScoreDetails;
