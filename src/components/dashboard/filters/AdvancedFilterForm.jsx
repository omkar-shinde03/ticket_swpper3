
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

export const AdvancedFilterForm = ({ 
  filters, 
  uniqueLocations, 
  uniqueOperators, 
  onUpdateFilter, 
  onApplyFilters, 
  onClearFilters 
}) => {
  return (
    <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
      {/* Location & Route */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">From</label>
          <Select value={filters.fromLocation} onValueChange={(value) => onUpdateFilter("fromLocation", value)}>
            <SelectTrigger>
              <SelectValue placeholder="Any departure city" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Any departure city</SelectItem>
              {uniqueLocations.map(location => (
                <SelectItem key={location} value={location}>{location}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">To</label>
          <Select value={filters.toLocation} onValueChange={(value) => onUpdateFilter("toLocation", value)}>
            <SelectTrigger>
              <SelectValue placeholder="Any destination city" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Any destination city</SelectItem>
              {uniqueLocations.map(location => (
                <SelectItem key={location} value={location}>{location}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Price Range */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Min Price (₹)</label>
          <Input
            type="number"
            placeholder="0"
            value={filters.minPrice}
            onChange={(e) => onUpdateFilter("minPrice", e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Max Price (₹)</label>
          <Input
            type="number"
            placeholder="No limit"
            value={filters.maxPrice}
            onChange={(e) => onUpdateFilter("maxPrice", e.target.value)}
          />
        </div>
      </div>

      {/* Date Range */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">From Date</label>
          <Input
            type="date"
            value={filters.departureDate}
            onChange={(e) => onUpdateFilter("departureDate", e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">To Date</label>
          <Input
            type="date"
            value={filters.returnDate}
            onChange={(e) => onUpdateFilter("returnDate", e.target.value)}
          />
        </div>
      </div>

      {/* Operator & Time */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Bus Operator</label>
          <Select value={filters.operator} onValueChange={(value) => onUpdateFilter("operator", value)}>
            <SelectTrigger>
              <SelectValue placeholder="Any operator" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Any operator</SelectItem>
              {uniqueOperators.map(operator => (
                <SelectItem key={operator} value={operator}>{operator}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Departure Time</label>
          <Select value={filters.timeRange} onValueChange={(value) => onUpdateFilter("timeRange", value)}>
            <SelectTrigger>
              <SelectValue placeholder="Any time" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Any time</SelectItem>
              <SelectItem value="morning">Morning (6 AM - 12 PM)</SelectItem>
              <SelectItem value="afternoon">Afternoon (12 PM - 6 PM)</SelectItem>
              <SelectItem value="evening">Evening (6 PM - 12 AM)</SelectItem>
              <SelectItem value="night">Night (12 AM - 6 AM)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Sort By */}
      <div>
        <label className="block text-sm font-medium mb-1">Sort By</label>
        <Select value={filters.sortBy} onValueChange={(value) => onUpdateFilter("sortBy", value)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="departure_date">Departure Date</SelectItem>
            <SelectItem value="departure_time">Departure Time</SelectItem>
            <SelectItem value="price_low">Price: Low to High</SelectItem>
            <SelectItem value="price_high">Price: High to Low</SelectItem>
            <SelectItem value="created_at">Recently Listed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Action Buttons */}
      <div className="flex space-x-2">
        <Button onClick={onApplyFilters} className="flex-1">
          Apply Filters
        </Button>
        <Button variant="outline" onClick={onClearFilters}>
          Clear All
        </Button>
      </div>
    </div>
  );
};
