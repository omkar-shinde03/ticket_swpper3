
import { Badge } from "@/components/ui/badge";
import { X, IndianRupee, Clock, Bus } from "lucide-react";

export const FilterBadges = ({ filters, onRemoveFilter }) => {
  return (
    <div className="flex flex-wrap gap-2">
      {filters.searchQuery && (
        <Badge variant="secondary" className="flex items-center gap-1">
          Search: {filters.searchQuery}
          <X className="h-3 w-3 cursor-pointer" onClick={() => onRemoveFilter("searchQuery")} />
        </Badge>
      )}
      {filters.fromLocation && (
        <Badge variant="secondary" className="flex items-center gap-1">
          From: {filters.fromLocation}
          <X className="h-3 w-3 cursor-pointer" onClick={() => onRemoveFilter("fromLocation")} />
        </Badge>
      )}
      {filters.toLocation && (
        <Badge variant="secondary" className="flex items-center gap-1">
          To: {filters.toLocation}
          <X className="h-3 w-3 cursor-pointer" onClick={() => onRemoveFilter("toLocation")} />
        </Badge>
      )}
      {(filters.minPrice || filters.maxPrice) && (
        <Badge variant="secondary" className="flex items-center gap-1">
          <IndianRupee className="h-3 w-3" />
          {filters.minPrice || "0"} - {filters.maxPrice || "∞"}
          <X className="h-3 w-3 cursor-pointer" onClick={() => {
            onRemoveFilter("minPrice");
            onRemoveFilter("maxPrice");
          }} />
        </Badge>
      )}
      {filters.operator && (
        <Badge variant="secondary" className="flex items-center gap-1">
          <Bus className="h-3 w-3" />
          {filters.operator}
          <X className="h-3 w-3 cursor-pointer" onClick={() => onRemoveFilter("operator")} />
        </Badge>
      )}
      {filters.timeRange && (
        <Badge variant="secondary" className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {filters.timeRange}
          <X className="h-3 w-3 cursor-pointer" onClick={() => onRemoveFilter("timeRange")} />
        </Badge>
      )}
    </div>
  );
};
