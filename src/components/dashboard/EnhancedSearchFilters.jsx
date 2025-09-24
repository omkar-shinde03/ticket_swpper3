
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Search, Filter, Calendar as CalendarIcon, MapPin, IndianRupee, Clock, Star } from "lucide-react";
import { format } from "date-fns";

export const EnhancedSearchFilters = ({ tickets, onFilteredResults }) => {
  const [filters, setFilters] = useState({
    searchQuery: "",
    fromLocation: "",
    toLocation: "",
    priceRange: [0, 5000],
    departureDate: null,
    returnDate: null,
    operator: "",
    timeRange: "",
    rating: 0,
    verificationStatus: "",
    seatType: ""
  });

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [activeFilters, setActiveFilters] = useState(0);

  // Get unique values for dropdowns
  const uniqueLocations = Array.from(new Set([
    ...tickets.map(t => t.from_location),
    ...tickets.map(t => t.to_location)
  ])).filter(Boolean).sort();

  const uniqueOperators = Array.from(new Set(
    tickets.map(t => t.bus_operator)
  )).filter(Boolean).sort();

  const applyFilters = () => {
    let filtered = [...tickets];

    // Text search
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      filtered = filtered.filter(ticket => 
        ticket.pnr_number?.toLowerCase().includes(query) ||
        ticket.from_location?.toLowerCase().includes(query) ||
        ticket.to_location?.toLowerCase().includes(query) ||
        ticket.bus_operator?.toLowerCase().includes(query) ||
        ticket.passenger_name?.toLowerCase().includes(query)
      );
    }

    // Location filters
    if (filters.fromLocation) {
      filtered = filtered.filter(ticket => ticket.from_location === filters.fromLocation);
    }
    if (filters.toLocation) {
      filtered = filtered.filter(ticket => ticket.to_location === filters.toLocation);
    }

    // Price range filter
    filtered = filtered.filter(ticket => {
      const price = ticket.selling_price || ticket.ticket_price || 0;
      return price >= filters.priceRange[0] && price <= filters.priceRange[1];
    });

    // Date filters
    if (filters.departureDate) {
      filtered = filtered.filter(ticket => 
        new Date(ticket.departure_date) >= filters.departureDate
      );
    }
    if (filters.returnDate) {
      filtered = filtered.filter(ticket => 
        new Date(ticket.departure_date) <= filters.returnDate
      );
    }

    // Operator filter
    if (filters.operator) {
      filtered = filtered.filter(ticket => ticket.bus_operator === filters.operator);
    }

    // Time range filter
    if (filters.timeRange) {
      filtered = filtered.filter(ticket => {
        const time = ticket.departure_time;
        if (!time) return true;
        switch (filters.timeRange) {
          case 'morning': return time >= '06:00' && time < '12:00';
          case 'afternoon': return time >= '12:00' && time < '18:00';
          case 'evening': return time >= '18:00' && time < '24:00';
          case 'night': return time >= '00:00' && time < '06:00';
          default: return true;
        }
      });
    }

    // Verification status filter
    if (filters.verificationStatus) {
      filtered = filtered.filter(ticket => 
        ticket.verification_status === filters.verificationStatus
      );
    }

    onFilteredResults(filtered);
  };

  const clearFilters = () => {
    setFilters({
      searchQuery: "",
      fromLocation: "",
      toLocation: "",
      priceRange: [0, 5000],
      departureDate: null,
      returnDate: null,
      operator: "",
      timeRange: "",
      rating: 0,
      verificationStatus: "",
      seatType: ""
    });
    onFilteredResults(tickets);
  };

  const updateFilter = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const removeFilter = (key) => {
    if (key === 'priceRange') {
      updateFilter(key, [0, 5000]);
    } else {
      updateFilter(key, key === 'departureDate' || key === 'returnDate' ? null : "");
    }
    setTimeout(applyFilters, 100);
  };

  // Count active filters
  useEffect(() => {
    const count = Object.entries(filters).filter(([key, value]) => {
      if (key === 'priceRange') return value[0] > 0 || value[1] < 5000;
      if (key === 'departureDate' || key === 'returnDate') return value !== null;
      return value && value !== "";
    }).length;
    setActiveFilters(count);
  }, [filters]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Search className="h-5 w-5" />
            <span>Enhanced Search & Filters</span>
            {activeFilters > 0 && (
              <Badge variant="secondary">{activeFilters} active</Badge>
            )}
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAdvanced(!showAdvanced)}
          >
            <Filter className="h-4 w-4 mr-2" />
            {showAdvanced ? "Hide" : "Show"} Advanced
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Main Search */}
        <div className="flex space-x-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by PNR, route, operator, or passenger name..."
              value={filters.searchQuery}
              onChange={(e) => updateFilter("searchQuery", e.target.value)}
              className="pl-10"
            />
          </div>
          <Button onClick={applyFilters}>Search</Button>
        </div>

        {/* Quick Filters */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <Select value={filters.fromLocation} onValueChange={(value) => updateFilter("fromLocation", value)}>
            <SelectTrigger>
              <SelectValue placeholder="From" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Any departure</SelectItem>
              {uniqueLocations.map(location => (
                <SelectItem key={location} value={location}>{location}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filters.toLocation} onValueChange={(value) => updateFilter("toLocation", value)}>
            <SelectTrigger>
              <SelectValue placeholder="To" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Any destination</SelectItem>
              {uniqueLocations.map(location => (
                <SelectItem key={location} value={location}>{location}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="justify-start text-left">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {filters.departureDate ? format(filters.departureDate, "MMM dd") : "Departure"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={filters.departureDate}
                onSelect={(date) => updateFilter("departureDate", date)}
                initialFocus
              />
            </PopoverContent>
          </Popover>

          <Select value={filters.operator} onValueChange={(value) => updateFilter("operator", value)}>
            <SelectTrigger>
              <SelectValue placeholder="Operator" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Any operator</SelectItem>
              {uniqueOperators.map(operator => (
                <SelectItem key={operator} value={operator}>{operator}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Advanced Filters */}
        {showAdvanced && (
          <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
            {/* Price Range */}
            <div>
              <label className="block text-sm font-medium mb-2 flex items-center">
                <IndianRupee className="h-4 w-4 mr-1" />
                Price Range: ₹{filters.priceRange[0]} - ₹{filters.priceRange[1]}
              </label>
              <Slider
                value={filters.priceRange}
                onValueChange={(value) => updateFilter("priceRange", value)}
                max={5000}
                step={100}
                className="w-full"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Time Range */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  <Clock className="h-4 w-4 inline mr-1" />
                  Departure Time
                </label>
                <Select value={filters.timeRange} onValueChange={(value) => updateFilter("timeRange", value)}>
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

              {/* Verification Status */}
              <div>
                <label className="block text-sm font-medium mb-1">Verification</label>
                <Select value={filters.verificationStatus} onValueChange={(value) => updateFilter("verificationStatus", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Any status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Any status</SelectItem>
                    <SelectItem value="verified">Verified</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="unverified">Unverified</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Return Date */}
              <div>
                <label className="block text-sm font-medium mb-1">Return Date</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {filters.returnDate ? format(filters.returnDate, "MMM dd, yyyy") : "Select return"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={filters.returnDate}
                      onSelect={(date) => updateFilter("returnDate", date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-2">
              <Button onClick={applyFilters} className="flex-1">
                Apply Filters
              </Button>
              <Button variant="outline" onClick={clearFilters}>
                Clear All
              </Button>
            </div>
          </div>
        )}

        {/* Active Filter Tags */}
        {activeFilters > 0 && (
          <div className="flex flex-wrap gap-2">
            {filters.searchQuery && (
              <Badge variant="secondary" className="flex items-center gap-1">
                Search: {filters.searchQuery}
                <button onClick={() => removeFilter("searchQuery")} className="ml-1 hover:text-red-600">×</button>
              </Badge>
            )}
            {filters.fromLocation && (
              <Badge variant="secondary" className="flex items-center gap-1">
                From: {filters.fromLocation}
                <button onClick={() => removeFilter("fromLocation")} className="ml-1 hover:text-red-600">×</button>
              </Badge>
            )}
            {filters.toLocation && (
              <Badge variant="secondary" className="flex items-center gap-1">
                To: {filters.toLocation}
                <button onClick={() => removeFilter("toLocation")} className="ml-1 hover:text-red-600">×</button>
              </Badge>
            )}
            {(filters.priceRange[0] > 0 || filters.priceRange[1] < 5000) && (
              <Badge variant="secondary" className="flex items-center gap-1">
                ₹{filters.priceRange[0]} - ₹{filters.priceRange[1]}
                <button onClick={() => removeFilter("priceRange")} className="ml-1 hover:text-red-600">×</button>
              </Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
