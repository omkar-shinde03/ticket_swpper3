
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, Calendar, MapPin, IndianRupee } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export const TicketSearch = ({ tickets, onFilteredResults }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRoute, setSelectedRoute] = useState("");
  const [priceRange, setPriceRange] = useState("");
  const [departureDate, setDepartureDate] = useState("");
  const [sortBy, setSortBy] = useState("departure_date");
  const [showFilters, setShowFilters] = useState(false);

  // Get unique routes for filter dropdown
  const uniqueRoutes = Array.from(new Set(
    tickets.map(ticket => `${ticket.from_location} → ${ticket.to_location}`)
  ));

  const applyFilters = () => {
    let filtered = [...tickets];

    // Search query filter
    if (searchQuery) {
      filtered = filtered.filter(ticket => 
        ticket.pnr_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ticket.from_location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ticket.to_location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ticket.bus_operator.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Route filter
    if (selectedRoute) {
      const [from, to] = selectedRoute.split(' → ');
      filtered = filtered.filter(ticket => 
        ticket.from_location === from && ticket.to_location === to
      );
    }

    // Price range filter
    if (priceRange) {
      const [min, max] = priceRange.split('-').map(Number);
      filtered = filtered.filter(ticket => {
        const price = ticket.selling_price || ticket.ticket_price;
        return price >= min && (max ? price <= max : true);
      });
    }

    // Departure date filter
    if (departureDate) {
      filtered = filtered.filter(ticket => 
        ticket.departure_date === departureDate
      );
    }

    // Sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'price_low':
          return (a.selling_price || a.ticket_price) - (b.selling_price || b.ticket_price);
        case 'price_high':
          return (b.selling_price || b.ticket_price) - (a.selling_price || a.ticket_price);
        case 'departure_date':
          return new Date(a.departure_date).getTime() - new Date(b.departure_date).getTime();
        case 'created_at':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        default:
          return 0;
      }
    });

    onFilteredResults(filtered);
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedRoute("");
    setPriceRange("");
    setDepartureDate("");
    setSortBy("departure_date");
    onFilteredResults(tickets);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Search className="h-5 w-5" />
            <span>Search & Filter Tickets</span>
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search Input */}
        <div className="flex space-x-2">
          <Input
            placeholder="Search by PNR, route, or operator..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1"
          />
          <Button onClick={applyFilters}>Search</Button>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border rounded-lg bg-gray-50">
            {/* Route Filter */}
            <div>
              <label className="block text-sm font-medium mb-2">Route</label>
              <Select value={selectedRoute} onValueChange={setSelectedRoute}>
                <SelectTrigger>
                  <SelectValue placeholder="Select route" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All routes</SelectItem>
                  {uniqueRoutes.map((route, index) => (
                    <SelectItem key={index} value={route}>
                      {route}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Price Range Filter */}
            <div>
              <label className="block text-sm font-medium mb-2">Price Range</label>
              <Select value={priceRange} onValueChange={setPriceRange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select price range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All prices</SelectItem>
                  <SelectItem value="0-500">Under ₹500</SelectItem>
                  <SelectItem value="500-1000">₹500 - ₹1000</SelectItem>
                  <SelectItem value="1000-2000">₹1000 - ₹2000</SelectItem>
                  <SelectItem value="2000-">Above ₹2000</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Departure Date Filter */}
            <div>
              <label className="block text-sm font-medium mb-2">Departure Date</label>
              <Input
                type="date"
                value={departureDate}
                onChange={(e) => setDepartureDate(e.target.value)}
              />
            </div>

            {/* Sort By */}
            <div>
              <label className="block text-sm font-medium mb-2">Sort By</label>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="departure_date">Departure Date</SelectItem>
                  <SelectItem value="price_low">Price: Low to High</SelectItem>
                  <SelectItem value="price_high">Price: High to Low</SelectItem>
                  <SelectItem value="created_at">Recently Added</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {/* Active Filters Display */}
        {(selectedRoute || priceRange || departureDate) && (
          <div className="flex flex-wrap gap-2">
            <span className="text-sm text-gray-600">Active filters:</span>
            {selectedRoute && (
              <Badge variant="secondary" className="flex items-center space-x-1">
                <MapPin className="h-3 w-3" />
                <span>{selectedRoute}</span>
                <button
                  onClick={() => setSelectedRoute("")}
                  className="ml-1 hover:text-red-500"
                >
                  ×
                </button>
              </Badge>
            )}
            {priceRange && (
              <Badge variant="secondary" className="flex items-center space-x-1">
                <IndianRupee className="h-3 w-3" />
                <span>{priceRange}</span>
                <button
                  onClick={() => setPriceRange("")}
                  className="ml-1 hover:text-red-500"
                >
                  ×
                </button>
              </Badge>
            )}
            {departureDate && (
              <Badge variant="secondary" className="flex items-center space-x-1">
                <Calendar className="h-3 w-3" />
                <span>{departureDate}</span>
                <button
                  onClick={() => setDepartureDate("")}
                  className="ml-1 hover:text-red-500"
                >
                  ×
                </button>
              </Badge>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={clearFilters}
              className="ml-2"
            >
              Clear All
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
