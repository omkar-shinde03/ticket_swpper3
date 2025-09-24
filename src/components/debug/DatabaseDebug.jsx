import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { testDatabaseSchema } from "@/utils/databaseTest";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, Database, TestTube } from "lucide-react";

export const DatabaseDebug = () => {
  const [testResults, setTestResults] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const runTests = async () => {
    setIsLoading(true);
    try {
      const results = await testDatabaseSchema();
      setTestResults(results);
    } catch (error) {
      setTestResults({
        success: false,
        error: error.message
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-4 left-4 z-50">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <Button variant="outline" size="sm" className="mb-2">
            <Database className="h-4 w-4 mr-2" />
            Database Debug
            <ChevronDown className="h-4 w-4 ml-2" />
          </Button>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <Card className="w-96 max-h-96 overflow-y-auto">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <TestTube className="h-4 w-4" />
                Database Schema Test
              </CardTitle>
              <CardDescription className="text-xs">
                Test database relationships and functions
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-3">
              <Button 
                onClick={runTests} 
                disabled={isLoading}
                size="sm" 
                className="w-full"
              >
                {isLoading ? "Running Tests..." : "Run Database Tests"}
              </Button>
              
              {testResults && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant={testResults.success ? "default" : "destructive"}>
                      {testResults.success ? "✅ Success" : "❌ Failed"}
                    </Badge>
                  </div>
                  
                  {testResults.success ? (
                    <div className="text-xs space-y-1">
                      <div>Available Tickets: {testResults.availableTickets}</div>
                      <div>Basic Tickets: {testResults.basicTickets}</div>
                      <div>Profiles: {testResults.profiles}</div>
                      <div>View Data: {testResults.viewData}</div>
                    </div>
                  ) : (
                    <div className="text-xs text-red-600">
                      Error: {testResults.error}
                    </div>
                  )}
                </div>
              )}
              
              <div className="text-xs text-muted-foreground">
                Open browser console for detailed logs
              </div>
            </CardContent>
          </Card>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};