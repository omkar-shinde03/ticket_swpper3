
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search, MapPin, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export const QuickSearchSection = ({ onSearch }) => {
  const [searchData, setSearchData] = useState({
    fromLocation: "",
    toLocation: "",
    date: ""
  });
  const { toast } = useToast();

  const handleSearch = async () => {
    if (!searchData.fromLocation && !searchData.toLocation && !searchData.date) {
      toast({
        title: "Search criteria required",
        description: "Please enter at least one search criteria",
        variant: "destructive",
      });
      return;
    }

    if (onSearch) {
      const results = await onSearch(searchData);
      toast({
        title: "Search completed",
        description: `Found ${results.length} tickets`,
      });
    }
  };
  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8 bg-background">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8 animate-fade-in-up">
          <h2 className="text-3xl font-bold text-foreground mb-4">Find Your Perfect Ticket</h2>
          <p className="text-muted-foreground">Search through thousands of verified bus tickets</p>
        </div>
        
        <Card className="shadow-lg glass-effect hover:shadow-xl transition-all duration-300 animate-scale-in">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-foreground">From</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Departure city"
                    value={searchData.fromLocation}
                    onChange={(e) => setSearchData(prev => ({ ...prev, fromLocation: e.target.value }))}
                    className="pl-10 border-border focus:ring-primary focus:border-primary"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm font-medium text-foreground">To</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Destination city"
                    value={searchData.toLocation}
                    onChange={(e) => setSearchData(prev => ({ ...prev, toLocation: e.target.value }))}
                    className="pl-10 border-border focus:ring-primary focus:border-primary"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm font-medium text-foreground">Date</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="date"
                    value={searchData.date}
                    onChange={(e) => setSearchData(prev => ({ ...prev, date: e.target.value }))}
                    className="pl-10 border-border focus:ring-primary focus:border-primary"
                  />
                </div>
              </div>
              
              <div className="flex items-end">
                <Button variant="gradient" className="w-full glow-effect" onClick={handleSearch}>
                  <Search className="mr-2 h-4 w-4" />
                  Search
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};
