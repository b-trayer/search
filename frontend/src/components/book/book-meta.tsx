import { User, Calendar, Building } from "lucide-react";

interface BookMetaProps {
  authors?: string;
  year?: number | null;
  organization?: string;
}

const BookMeta = ({ authors, year, organization }: BookMetaProps) => {
  const hasContent = authors || year || organization;

  if (!hasContent) return null;

  return (
    <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
      {authors && (
        <span className="flex items-center gap-1">
          <User className="h-4 w-4" />
          {authors}
        </span>
      )}
      {year && (
        <span className="flex items-center gap-1">
          <Calendar className="h-4 w-4" />
          {year}
        </span>
      )}
      {organization && (
        <span className="flex items-center gap-1">
          <Building className="h-4 w-4" />
          {organization}
        </span>
      )}
    </div>
  );
};

export default BookMeta;
