import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { 
  testApiConnectivity, 
  validatePNRInBackground, 
  detectOperatorFromPNR,
  formatPNR 
} from '@/utils/pnrValidation';
// import { TicketApiClient } from '@/utils/ticketApiClient';
import { ApiTestUtility } from './ApiTestUtility';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Loader, 
  Bug, 
  Wifi, 
  Database,
  Search,
  RefreshCw,
  Globe
} from 'lucide-react';

export const PNRDebugPanel = () => {
  const [testResults, setTestResults] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [testPNR, setTestPNR] = useState('ABC123');
  const [testPassengerName, setTestPassengerName] = useState('John Doe');
  const [testOperator, setTestOperator] = useState('RedBus');
  const [apiConnectivity, setApiConnectivity] = useState(null);
  const [validationResult, setValidationResult] = useState(null);
  const [activeTab, setActiveTab] = useState('connectivity');

  const runConnectivityTest = async () => {
    setIsLoading(true);
    try {
      const result = await testApiConnectivity();
      setApiConnectivity(result);
    } catch (error) {
      setApiConnectivity({
        success: false,
        error: error.message,
        message: 'Connectivity test failed'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const runPNRValidationTest = async () => {
    setIsLoading(true);
    try {
      const result = await validatePNRInBackground(testPNR, testOperator, {
        passengerName: testPassengerName
      });
      setValidationResult(result);
    } catch (error) {
      setValidationResult({
        isValid: false,
        error: error.message
      });
    } finally {
      setIsLoading(false);
    }
  };

  const runAllTests = async () => {
    setIsLoading(true);
    setTestResults({});
    
    const tests = [
      {
        name: 'API Connectivity',
        test: testApiConnectivity
      },
      {
        name: 'PNR Format Detection',
        test: () => Promise.resolve({
          success: true,
          data: {
            'ABC123': detectOperatorFromPNR('ABC123'),
            'MMT12345678': detectOperatorFromPNR('MMT12345678'),
            'KA12345678': detectOperatorFromPNR('KA12345678'),
            'INVALID': detectOperatorFromPNR('INVALID')
          }
        })
      },
      {
        name: 'PNR Formatting',
        test: () => Promise.resolve({
          success: true,
          data: {
            'abc-123': formatPNR('abc-123'),
            'ABC 123': formatPNR('ABC 123'),
            'abc@123#': formatPNR('abc@123#')
          }
        })
      }
    ];

    const results = {};
    for (const test of tests) {
      try {
        results[test.name] = await test.test();
      } catch (error) {
        results[test.name] = {
          success: false,
          error: error.message
        };
      }
    }
    
    setTestResults(results);
    setIsLoading(false);
  };

  const getStatusIcon = (success) => {
    if (success === null || success === undefined) {
      return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    }
    return success ? 
      <CheckCircle className="h-4 w-4 text-green-500" /> : 
      <XCircle className="h-4 w-4 text-red-500" />;
  };

  const getStatusBadge = (success) => {
    if (success === null || success === undefined) {
      return <Badge variant="outline">Unknown</Badge>;
    }
    return success ? 
      <Badge className="bg-green-100 text-green-800">Success</Badge> : 
      <Badge variant="destructive">Failed</Badge>;
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bug className="h-5 w-5" />
            PNR Validation Debug Panel
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Debug and test the PNR validation system to identify issues
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Tab Navigation */}
          <div className="flex gap-2 border-b">
            <button
              onClick={() => setActiveTab('connectivity')}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'connectivity' 
                  ? 'border-blue-500 text-blue-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Wifi className="h-4 w-4 inline mr-2" />
              Connectivity
            </button>
            <button
              onClick={() => setActiveTab('validation')}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'validation' 
                  ? 'border-blue-500 text-blue-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Search className="h-4 w-4 inline mr-2" />
              Validation
            </button>
            <button
              onClick={() => setActiveTab('api-test')}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'api-test' 
                  ? 'border-blue-500 text-blue-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Globe className="h-4 w-4 inline mr-2" />
              API Test
            </button>
          </div>

          {/* Quick Actions */}
          <div className="flex gap-2 flex-wrap">
            <Button onClick={runConnectivityTest} disabled={isLoading} variant="outline">
              <Wifi className="h-4 w-4 mr-2" />
              Test API Connectivity
            </Button>
            <Button onClick={runAllTests} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Run All Tests
            </Button>
          </div>

          {/* Tab Content */}
          {activeTab === 'connectivity' && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Database className="h-4 w-4" />
                  API Connectivity Test
                  {apiConnectivity && getStatusIcon(apiConnectivity.success)}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {apiConnectivity ? (
                  <div className="space-y-3">
                    {getStatusBadge(apiConnectivity.success)}
                    <p className="text-sm">{apiConnectivity.message}</p>
                    
                    {apiConnectivity.success && apiConnectivity.data && (
                      <div className="bg-green-50 border border-green-200 rounded p-3">
                        <p className="text-sm text-green-800">
                          <strong>API Response:</strong> Found {apiConnectivity.data.length} tickets
                        </p>
                        <details className="mt-2">
                          <summary className="cursor-pointer text-sm font-medium">View Sample Data</summary>
                          <pre className="mt-2 text-xs bg-white p-2 rounded border overflow-auto max-h-32">
                            {JSON.stringify(apiConnectivity.data.slice(0, 2), null, 2)}
                          </pre>
                        </details>
                      </div>
                    )}
                    
                    {!apiConnectivity.success && (
                      <Alert>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          <strong>Error:</strong> {apiConnectivity.error}
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Click "Test API Connectivity" to check if the PNR validation API is accessible.
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {activeTab === 'validation' && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Search className="h-4 w-4" />
                  PNR Validation Test
                  {validationResult && getStatusIcon(validationResult.isValid)}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="test-pnr">Test PNR</Label>
                    <Input
                      id="test-pnr"
                      value={testPNR}
                      onChange={(e) => setTestPNR(e.target.value)}
                      placeholder="Enter PNR to test"
                    />
                  </div>
                  <div>
                    <Label htmlFor="test-passenger">Passenger Name</Label>
                    <Input
                      id="test-passenger"
                      value={testPassengerName}
                      onChange={(e) => setTestPassengerName(e.target.value)}
                      placeholder="Enter passenger name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="test-operator">Bus Operator</Label>
                    <Input
                      id="test-operator"
                      value={testOperator}
                      onChange={(e) => setTestOperator(e.target.value)}
                      placeholder="Enter bus operator"
                    />
                  </div>
                </div>
                
                <Button onClick={runPNRValidationTest} disabled={isLoading} className="w-full">
                  {isLoading ? (
                    <>
                      <Loader className="h-4 w-4 mr-2 animate-spin" />
                      Validating...
                    </>
                  ) : (
                    'Test PNR Validation'
                  )}
                </Button>

                {validationResult && (
                  <div className="space-y-3">
                    {getStatusBadge(validationResult.isValid)}
                    
                    {validationResult.isValid ? (
                      <div className="bg-green-50 border border-green-200 rounded p-3">
                        <p className="text-sm text-green-800 font-medium">✅ Validation Successful!</p>
                        {validationResult.ticketData && (
                          <div className="mt-2 text-xs">
                            <strong>Ticket Data:</strong>
                            <pre className="mt-1 bg-white p-2 rounded border overflow-auto">
                              {JSON.stringify(validationResult.ticketData, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    ) : (
                      <Alert>
                        <XCircle className="h-4 w-4" />
                        <AlertDescription>
                          <strong>Validation Failed:</strong> {validationResult.error}
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                )}
                
                {/* Quick Test PNRs */}
                <div className="border-t pt-4">
                  <h4 className="text-sm font-medium mb-2">Quick Test PNRs:</h4>
                  <div className="flex gap-2 flex-wrap">
                    {[
                      { pnr: 'ABC123', name: 'John Doe' },
                      { pnr: 'XYZ789', name: 'Jane Smith' },
                      { pnr: 'TEST123', name: 'Test User' },
                      { pnr: 'DEMO456', name: 'Demo User' }
                    ].map((test) => (
                      <Button
                        key={test.pnr}
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setTestPNR(test.pnr);
                          setTestPassengerName(test.name);
                        }}
                      >
                        {test.pnr}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'api-test' && (
            <ApiTestUtility />
          )}

          {/* Test Results */}
          {Object.keys(testResults).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>All Test Results</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(testResults).map(([testName, result]) => (
                    <div key={testName} className="border rounded p-3">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{testName}</h4>
                        {getStatusIcon(result.success)}
                      </div>
                      
                      {result.success ? (
                        <div className="text-sm text-green-600">
                          ✅ Test passed
                          {result.data && (
                            <details className="mt-2">
                              <summary className="cursor-pointer">View Details</summary>
                              <pre className="mt-1 text-xs bg-gray-100 p-2 rounded overflow-auto max-h-32">
                                {JSON.stringify(result.data, null, 2)}
                              </pre>
                            </details>
                          )}
                        </div>
                      ) : (
                        <div className="text-sm text-red-600">
                          ❌ Test failed: {result.error}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Debug Information */}
          <Card>
            <CardHeader>
              <CardTitle>Debug Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-sm space-y-2">
                <div><strong>API Endpoint:</strong> https://ticekt-demo-api.onrender.com/tickets</div>
                <div><strong>Environment:</strong> {import.meta.env.DEV ? 'Development' : 'Production'}</div>
                <div><strong>Debug Mode:</strong> {import.meta.env.DEV ? 'Enabled' : 'Disabled'}</div>
                <div><strong>Browser:</strong> {navigator.userAgent}</div>
                <div><strong>CORS Support:</strong> {window.fetch ? 'Available' : 'Not Available'}</div>
                <div><strong>Network Status:</strong> {navigator.onLine ? 'Online' : 'Offline'}</div>
              </div>
              
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Common Issues:</strong>
                  <ul className="mt-2 text-sm list-disc list-inside space-y-1">
                    <li>API server is down or not responding</li>
                    <li>CORS issues preventing API access</li>
                    <li>Network connectivity problems</li>
                    <li>Invalid API response format</li>
                    <li>PNR not found in API database</li>
                    <li>Passenger name mismatch</li>
                    <li>Request timeout (10+ seconds)</li>
                    <li>Invalid JSON response from API</li>
                  </ul>
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
};