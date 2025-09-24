
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Filter } from "lucide-react";
import { AdvancedFilterForm } from "./filters/AdvancedFilterForm";
import { FilterBadges } from "./filters/FilterBadges";
import { useTicketFilters } from "./filters/useTicketFilters";

/**
 * @typedef {Object} AdvancedTicketFiltersProps
 * @property {any[]} tickets
 * @property {(filteredTickets: any[]) => void} onFilteredResults
 */

export const AdvancedTicketFilters = ({ tickets, onFilteredResults }) => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const {
    filters,
    applyFilters,
    clearFilters,
    updateFilter,
    removeFilter
  } = useTicketFilters(tickets, onFilteredResults);

  // Get unique values for dropdowns
  const uniqueLocations = Array.from(new Set([
    ...tickets.map(t => t.from_location),
    ...tickets.map(t => t.to_location)
  ])).sort();

  const uniqueOperators = Array.from(new Set(
    tickets.map(t => t.bus_operator)
  )).sort();

  const activeFiltersCount = Object.values(filters).filter(v => v && v !== "departure_date").length;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Filter className="h-5 w-5" />
            <span>Advanced Search & Filters</span>
            {activeFiltersCount > 0 && (
              <Badge variant="secondary">{activeFiltersCount} active</Badge>
            )}
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAdvanced(!showAdvanced)}
          >
            <Filter className="h-4 w-4 mr-2" />
            {showAdvanced ? "Hide" : "Show"} Filters
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Main Search */}
        <div className="flex space-x-2">
          <Input
            placeholder="Search by PNR, route, operator, or passenger name..."
            value={filters.searchQuery}
            onChange={(e) => updateFilter("searchQuery", e.target.value)}
            className="flex-1"
          />
          <Button onClick={applyFilters}>Search</Button>
        </div>

        {/* Advanced Filters */}
        {showAdvanced && (
          <AdvancedFilterForm
            filters={filters}
            uniqueLocations={uniqueLocations}
            uniqueOperators={uniqueOperators}
            onUpdateFilter={updateFilter}
            onApplyFilters={applyFilters}
            onClearFilters={clearFilters}
          />
        )}

        {/* Active Filter Tags */}
        <FilterBadges filters={filters} onRemoveFilter={removeFilter} />
      </CardContent>
    </Card>
  );
};
