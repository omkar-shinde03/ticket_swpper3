
import React, { useState } from "react";

export const useTicketFilters = (tickets, onFilteredResults) => {
  const [filters, setFilters] = useState({
    searchQuery: "",
    fromLocation: "",
    toLocation: "",
    minPrice: "",
    maxPrice: "",
    departureDate: "",
    returnDate: "",
    operator: "",
    sortBy: "departure_date",
    timeRange: ""
  });

  const applyFilters = () => {
    let filtered = [...tickets];

    // Text search
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      filtered = filtered.filter(ticket => 
        ticket.pnr_number.toLowerCase().includes(query) ||
        ticket.from_location.toLowerCase().includes(query) ||
        ticket.to_location.toLowerCase().includes(query) ||
        ticket.bus_operator.toLowerCase().includes(query) ||
        ticket.passenger_name.toLowerCase().includes(query)
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
    if (filters.minPrice || filters.maxPrice) {
      filtered = filtered.filter(ticket => {
        const price = ticket.selling_price || ticket.ticket_price;
        const min = filters.minPrice ? Number(filters.minPrice) : 0;
        const max = filters.maxPrice ? Number(filters.maxPrice) : Infinity;
        return price >= min && price <= max;
      });
    }

    // Date filters
    if (filters.departureDate) {
      filtered = filtered.filter(ticket => ticket.departure_date >= filters.departureDate);
    }
    if (filters.returnDate) {
      filtered = filtered.filter(ticket => ticket.departure_date <= filters.returnDate);
    }

    // Operator filter
    if (filters.operator) {
      filtered = filtered.filter(ticket => ticket.bus_operator === filters.operator);
    }

    // Time range filter
    if (filters.timeRange) {
      filtered = filtered.filter(ticket => {
        const time = ticket.departure_time;
        switch (filters.timeRange) {
          case 'morning': return time >= '06:00' && time < '12:00';
          case 'afternoon': return time >= '12:00' && time < '18:00';
          case 'evening': return time >= '18:00' && time < '24:00';
          case 'night': return time >= '00:00' && time < '06:00';
          default: return true;
        }
      });
    }

    // Sorting
    filtered.sort((a, b) => {
      switch (filters.sortBy) {
        case 'price_low':
          return (a.selling_price || a.ticket_price) - (b.selling_price || b.ticket_price);
        case 'price_high':
          return (b.selling_price || b.ticket_price) - (a.selling_price || a.ticket_price);
        case 'departure_date':
          return new Date(a.departure_date).getTime() - new Date(b.departure_date).getTime();
        case 'departure_time':
          return a.departure_time.localeCompare(b.departure_time);
        case 'created_at':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        default:
          return 0;
      }
    });

    onFilteredResults(filtered);
  };

  const clearFilters = () => {
    setFilters({
      searchQuery: "",
      fromLocation: "",
      toLocation: "",
      minPrice: "",
      maxPrice: "",
      departureDate: "",
      returnDate: "",
      operator: "",
      sortBy: "departure_date",
      timeRange: ""
    });
    onFilteredResults(tickets);
  };

  const updateFilter = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const removeFilter = (key) => {
    updateFilter(key, "");
    applyFilters();
  };

  return {
    filters,
    applyFilters,
    clearFilters,
    updateFilter,
    removeFilter
  };
};
