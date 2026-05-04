interface ScorePersonalizationProps {
  fType: number;
  fTopic: number;
  fUser: number;
  userContrib: number;
  weights: { w_user: number; alpha_type: number; alpha_topic: number };
}

export const ScorePersonalization = ({ fType, fTopic, fUser, userContrib, weights }: ScorePersonalizationProps) => {
  const alphaFType = weights.alpha_type * fType;
  const alphaFTopic = weights.alpha_topic * fTopic;

  return (
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
        <span>α₁ × f_type = {weights.alpha_type} × {fType.toFixed(3)}</span>
        <span className="text-right">{alphaFType.toFixed(3)}</span>
        <span>α₂ × f_topic = {weights.alpha_topic} × {fTopic.toFixed(3)}</span>
        <span className="text-right">{alphaFTopic.toFixed(3)}</span>
        <span className="col-span-2 border-t border-border/30 my-1"></span>
        <span>f(U,D) = α₁·f_type + α₂·f_topic</span>
        <span className="text-right font-medium text-foreground">{fUser.toFixed(3)}</span>
        <span>w<sub>u</sub> × f(U,D) = {weights.w_user} × {fUser.toFixed(3)}</span>
        <span className="text-right font-medium text-foreground">{userContrib.toFixed(3)}</span>
      </div>
    </div>
  );
};
