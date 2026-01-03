const SearchResultsSkeleton = () => {
  return (
    <div className="space-y-3">
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="flex gap-4 rounded-xl bg-card p-5 shadow-card animate-pulse"
          style={{ animationDelay: `${i * 100}ms` }}
        >
          {}
          <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-muted" />

          {}
          <div className="flex-1 space-y-3">
            {}
            <div className="h-6 bg-muted rounded-md w-3/4" />
            {}
            <div className="h-4 bg-muted rounded-md w-1/2" />
            {}
            <div className="flex gap-2">
              <div className="h-5 bg-muted rounded-full w-16" />
              <div className="h-5 bg-muted rounded-full w-20" />
              <div className="h-5 bg-muted rounded-full w-24" />
            </div>
            {}
            <div className="space-y-2">
              <div className="h-4 bg-muted rounded-md w-full" />
              <div className="h-4 bg-muted rounded-md w-5/6" />
            </div>
          </div>
        </div>
      ))}
      {}
      <style>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        .animate-pulse > div {
          background: linear-gradient(
            90deg,
            hsl(var(--muted)) 25%,
            hsl(var(--muted-foreground) / 0.1) 50%,
            hsl(var(--muted)) 75%
          );
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite;
        }
      `}</style>
    </div>
  );
};

export default SearchResultsSkeleton;
