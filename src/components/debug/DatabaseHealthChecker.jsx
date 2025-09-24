import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Database, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  RefreshCw,
  Copy,
  ExternalLink,
  Settings,
  Shield,
  Activity,
  FileText,
  Zap
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { DatabaseAnalyzer, quickHealthCheck } from '@/utils/databaseAnalysis';

export const DatabaseHealthChecker = () => {
  const [analysis, setAnalysis] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [quickHealth, setQuickHealth] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const { toast } = useToast();

  const runQuickCheck = async () => {
    setIsAnalyzing(true);
    try {
      const result = await quickHealthCheck();
      setQuickHealth(result);
      
      toast({
        title: result.status === 'healthy' ? 'Database Healthy' : 'Issues Found',
        description: result.message,
        variant: result.status === 'healthy' ? 'default' : 'destructive'
      });
    } catch (error) {
      toast({
        title: 'Health Check Failed',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const runFullAnalysis = async () => {
    setIsAnalyzing(true);
    try {
      const analyzer = new DatabaseAnalyzer();
      const result = await analyzer.analyzeDatabase();
      
      if (result.success) {
        await analyzer.generateFixes();
        setAnalysis(result);
        setActiveTab('issues');
        
        toast({
          title: 'Analysis Complete',
          description: `Found ${result.issues.length} issues and ${result.warnings.length} warnings`,
          variant: result.issues.length > 0 ? 'destructive' : 'default'
        });
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      toast({
        title: 'Analysis Failed',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied to Clipboard',
      description: 'SQL has been copied to your clipboard'
    });
  };

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'high':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'medium':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'low':
        return <AlertTriangle className="h-4 w-4 text-blue-500" />;
      default:
        return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
  };

  const getSeverityBadge = (severity) => {
    const variants = {
      high: 'destructive',
      medium: 'default',
      low: 'secondary'
    };
    return <Badge variant={variants[severity] || 'secondary'}>{severity?.toUpperCase()}</Badge>;
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'critical':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'needs_attention':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      default:
        return <AlertTriangle className="h-5 w-5 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Supabase Database Health Checker
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Analyze and fix common database issues in your TicketSwapper application
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Quick Actions */}
          <div className="flex gap-2">
            <Button 
              onClick={runQuickCheck} 
              disabled={isAnalyzing}
              variant="outline"
            >
              <Activity className="h-4 w-4 mr-2" />
              {isAnalyzing ? 'Checking...' : 'Quick Health Check'}
            </Button>
            
            <Button 
              onClick={runFullAnalysis} 
              disabled={isAnalyzing}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isAnalyzing ? 'animate-spin' : ''}`} />
              {isAnalyzing ? 'Analyzing...' : 'Full Analysis'}
            </Button>
          </div>

          {/* Quick Health Status */}
          {quickHealth && (
            <Alert className={`border-2 ${
              quickHealth.status === 'healthy' ? 'border-green-200 bg-green-50' :
              quickHealth.status === 'critical' ? 'border-red-200 bg-red-50' :
              'border-yellow-200 bg-yellow-50'
            }`}>
              <div className="flex items-center gap-2">
                {getStatusIcon(quickHealth.status)}
                <AlertDescription className="flex-1">
                  <strong>{quickHealth.status.toUpperCase()}:</strong> {quickHealth.message}
                  {quickHealth.recommendation && (
                    <div className="mt-1 text-sm">
                      <strong>Recommendation:</strong> {quickHealth.recommendation}
                    </div>
                  )}
                </AlertDescription>
              </div>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Full Analysis Results */}
      {analysis && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Database Analysis Results
              </div>
              <div className="flex items-center gap-2">
                {getStatusIcon(analysis.summary.status)}
                <Badge variant={analysis.summary.status === 'healthy' ? 'default' : 'destructive'}>
                  {analysis.summary.status.replace('_', ' ').toUpperCase()}
                </Badge>
              </div>
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {analysis.summary.recommendation}
            </p>
          </CardHeader>
          
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="issues">
                  Issues ({analysis.issues.length})
                </TabsTrigger>
                <TabsTrigger value="fixes">
                  Fixes ({analysis.fixes.length})
                </TabsTrigger>
                <TabsTrigger value="warnings">
                  Warnings ({analysis.warnings.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-red-600">
                        {analysis.summary.highSeverity}
                      </div>
                      <div className="text-sm text-muted-foreground">Critical Issues</div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-yellow-600">
                        {analysis.summary.mediumSeverity}
                      </div>
                      <div className="text-sm text-muted-foreground">Medium Issues</div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {analysis.summary.lowSeverity}
                      </div>
                      <div className="text-sm text-muted-foreground">Low Issues</div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-gray-600">
                        {analysis.summary.warnings}
                      </div>
                      <div className="text-sm text-muted-foreground">Warnings</div>
                    </CardContent>
                  </Card>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 mb-2">Database Status Summary</h4>
                  <p className="text-sm text-blue-800">
                    {analysis.summary.recommendation}
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="issues" className="space-y-4">
                <ScrollArea className="h-96">
                  {analysis.issues.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
                      <p>No issues found! Your database is healthy.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {analysis.issues.map((issue, index) => (
                        <div key={index} className="border rounded-lg p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              {getSeverityIcon(issue.severity)}
                              <span className="font-medium">{issue.type.replace('_', ' ').toUpperCase()}</span>
                              {getSeverityBadge(issue.severity)}
                            </div>
                            {issue.table && (
                              <Badge variant="outline">{issue.table}</Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-700 mb-2">{issue.message}</p>
                          {issue.fix && (
                            <div className="text-xs bg-blue-50 p-2 rounded border">
                              <strong>Suggested Fix:</strong> {issue.fix}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>

              <TabsContent value="fixes" className="space-y-4">
                <ScrollArea className="h-96">
                  {analysis.fixes.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Zap className="h-12 w-12 mx-auto mb-4" />
                      <p>No automated fixes available.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {analysis.fixes.map((fix, index) => (
                        <Card key={index}>
                          <CardHeader className="pb-3">
                            <CardTitle className="text-lg flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Settings className="h-4 w-4" />
                                {fix.description}
                              </div>
                              {getSeverityBadge(fix.severity)}
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            {fix.sql && (
                              <div>
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-sm font-medium">SQL to Execute:</span>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => copyToClipboard(fix.sql)}
                                  >
                                    <Copy className="h-3 w-3 mr-1" />
                                    Copy SQL
                                  </Button>
                                </div>
                                <pre className="text-xs bg-gray-100 p-3 rounded border overflow-auto max-h-32">
                                  {fix.sql}
                                </pre>
                              </div>
                            )}
                            
                            {fix.instructions && (
                              <div>
                                <span className="text-sm font-medium">Manual Steps:</span>
                                <div className="mt-2 space-y-2">
                                  {fix.instructions.map((instruction, idx) => (
                                    <div key={idx} className="text-sm bg-blue-50 p-2 rounded">
                                      <strong>Bucket: {instruction.bucket}</strong>
                                      <ul className="mt-1 ml-4 list-disc text-xs">
                                        {instruction.instructions.map((step, stepIdx) => (
                                          <li key={stepIdx}>{step}</li>
                                        ))}
                                      </ul>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>

              <TabsContent value="warnings" className="space-y-4">
                <ScrollArea className="h-96">
                  {analysis.warnings.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
                      <p>No warnings found.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {analysis.warnings.map((warning, index) => (
                        <div key={index} className="border border-yellow-200 bg-yellow-50 rounded-lg p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <AlertTriangle className="h-4 w-4 text-yellow-600" />
                            <span className="font-medium text-yellow-800">
                              {warning.type.replace('_', ' ').toUpperCase()}
                            </span>
                          </div>
                          <p className="text-sm text-yellow-700">{warning.message}</p>
                          {warning.details && (
                            <div className="mt-2 text-xs text-yellow-600">
                              <strong>Details:</strong>
                              <ul className="mt-1 ml-4 list-disc">
                                {warning.details.map((detail, idx) => (
                                  <li key={idx}>{detail}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

      {/* Common Issues and Solutions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Common Database Issues & Solutions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="border rounded-lg p-4">
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <XCircle className="h-4 w-4 text-red-500" />
                Missing Tables
              </h4>
              <p className="text-sm text-gray-600 mb-2">
                Tables don't exist or weren't created properly during migration.
              </p>
              <div className="text-xs bg-gray-100 p-2 rounded">
                <strong>Solution:</strong> Run the database migrations in Supabase SQL Editor
              </div>
            </div>

            <div className="border rounded-lg p-4">
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <Shield className="h-4 w-4 text-yellow-500" />
                RLS Policy Issues
              </h4>
              <p className="text-sm text-gray-600 mb-2">
                Row Level Security policies are too restrictive or missing.
              </p>
              <div className="text-xs bg-gray-100 p-2 rounded">
                <strong>Solution:</strong> Update RLS policies to allow proper access
              </div>
            </div>

            <div className="border rounded-lg p-4">
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <Database className="h-4 w-4 text-blue-500" />
                Missing Functions
              </h4>
              <p className="text-sm text-gray-600 mb-2">
                Database functions for complex queries are missing.
              </p>
              <div className="text-xs bg-gray-100 p-2 rounded">
                <strong>Solution:</strong> Create the required PostgreSQL functions
              </div>
            </div>

            <div className="border rounded-lg p-4">
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-purple-500" />
                Foreign Key Issues
              </h4>
              <p className="text-sm text-gray-600 mb-2">
                Relationships between tables are broken or misconfigured.
              </p>
              <div className="text-xs bg-gray-100 p-2 rounded">
                <strong>Solution:</strong> Fix foreign key constraints and relationships
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">Quick Fix Steps:</h4>
            <ol className="text-sm text-blue-800 space-y-1 ml-4 list-decimal">
              <li>Run the Full Analysis above to identify specific issues</li>
              <li>Copy the generated SQL fixes to your clipboard</li>
              <li>Go to your Supabase Dashboard → SQL Editor</li>
              <li>Paste and execute the SQL fixes</li>
              <li>Run the health check again to verify fixes</li>
            </ol>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => window.open('https://supabase.com/dashboard', '_blank')}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Open Supabase Dashboard
            </Button>
            
            <Button
              variant="outline"
              onClick={() => window.open('https://supabase.com/docs/guides/database', '_blank')}
            >
              <FileText className="h-4 w-4 mr-2" />
              Database Documentation
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};