import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import * as TicketApiClient from '@/utils/ticketApiClient';
// import { TicketApiClient } from '@/utils/ticketApiClient';
import { 
  Globe, 
  Send, 
  CheckCircle, 
  XCircle, 
  Loader, 
  Copy,
  ExternalLink,
  RefreshCw
} from 'lucide-react';

export const ApiTestUtility = () => {
  const [apiUrl, setApiUrl] = useState('https://ticekt-demo-api.onrender.com/tickets');
  const [customHeaders, setCustomHeaders] = useState('{}');
  const [testResult, setTestResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [rawResponse, setRawResponse] = useState('');

  const testCustomApi = async () => {
    setIsLoading(true);
    setTestResult(null);
    setRawResponse('');

    try {
      let headers = {};
      try {
        headers = JSON.parse(customHeaders);
      } catch (e) {
        headers = { 'Accept': 'application/json' };
      }

      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          ...headers
        },
        mode: 'cors'
      });

      const responseText = await response.text();
      setRawResponse(responseText);

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        throw new Error(`Invalid JSON response: ${responseText.substring(0, 200)}...`);
      }

      setTestResult({
        success: response.ok,
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        data: data,
        isArray: Array.isArray(data),
        count: Array.isArray(data) ? data.length : 'N/A'
      });

    } catch (error) {
      setTestResult({
        success: false,
        error: error.message,
        type: error.name
      });
    } finally {
      setIsLoading(false);
    }
  };

  const testTicketApiClient = async () => {
    setIsLoading(true);
    try {
      const result = await TicketApiClient.testConnectivity();
      setTestResult({
        success: result.success,
        clientTest: true,
        ...result
      });
    } catch (error) {
      setTestResult({
        success: false,
        clientTest: true,
        error: error.message
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  const openInNewTab = () => {
    window.open(apiUrl, '_blank');
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            API Test Utility
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Test API endpoints and debug connectivity issues
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* API URL Input */}
          <div className="space-y-2">
            <Label htmlFor="api-url">API Endpoint URL</Label>
            <div className="flex gap-2">
              <Input
                id="api-url"
                value={apiUrl}
                onChange={(e) => setApiUrl(e.target.value)}
                placeholder="https://api.example.com/tickets"
                className="flex-1"
              />
              <Button variant="outline" size="icon" onClick={openInNewTab}>
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Custom Headers */}
          <div className="space-y-2">
            <Label htmlFor="headers">Custom Headers (JSON)</Label>
            <Textarea
              id="headers"
              value={customHeaders}
              onChange={(e) => setCustomHeaders(e.target.value)}
              placeholder='{"Authorization": "Bearer token", "X-API-Key": "key"}'
              rows={3}
            />
          </div>

          {/* Test Buttons */}
          <div className="flex gap-2">
            <Button onClick={testCustomApi} disabled={isLoading} className="flex-1">
              {isLoading ? (
                <>
                  <Loader className="h-4 w-4 mr-2 animate-spin" />
                  Testing...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Test API Endpoint
                </>
              )}
            </Button>
            {/* <Button onClick={testTicketApiClient} disabled={isLoading} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Test Client
            </Button> */}
          </div>

          {/* Test Results */}
          {testResult && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                {testResult.success ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500" />
                )}
                <Badge variant={testResult.success ? "default" : "destructive"}>
                  {testResult.success ? "Success" : "Failed"}
                </Badge>
                {testResult.clientTest && (
                  <Badge variant="outline">Client Test</Badge>
                )}
              </div>

              {testResult.success ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <strong>Status:</strong> {testResult.status} {testResult.statusText}
                    </div>
                    <div>
                      <strong>Response Type:</strong> {testResult.isArray ? 'Array' : 'Object'}
                    </div>
                    {testResult.count !== 'N/A' && (
                      <div>
                        <strong>Items Count:</strong> {testResult.count}
                      </div>
                    )}
                    <div>
                      <strong>Endpoint:</strong> {testResult.endpoint || apiUrl}
                    </div>
                  </div>

                  {testResult.data && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <strong className="text-sm">Response Data:</strong>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(JSON.stringify(testResult.data, null, 2))}
                        >
                          <Copy className="h-3 w-3 mr-1" />
                          Copy
                        </Button>
                      </div>
                      <pre className="text-xs bg-gray-100 p-3 rounded border overflow-auto max-h-64">
                        {JSON.stringify(testResult.data, null, 2)}
                      </pre>
                    </div>
                  )}

                  {testResult.headers && (
                    <details>
                      <summary className="cursor-pointer text-sm font-medium">Response Headers</summary>
                      <pre className="mt-2 text-xs bg-gray-100 p-2 rounded border overflow-auto">
                        {JSON.stringify(testResult.headers, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              ) : (
                <Alert>
                  <XCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Error:</strong> {testResult.error}
                    {testResult.type && (
                      <div className="mt-1">
                        <strong>Type:</strong> {testResult.type}
                      </div>
                    )}
                  </AlertDescription>
                </Alert>
              )}

              {/* Raw Response */}
              {rawResponse && (
                <details>
                  <summary className="cursor-pointer text-sm font-medium">Raw Response</summary>
                  <pre className="mt-2 text-xs bg-gray-100 p-2 rounded border overflow-auto max-h-32">
                    {rawResponse}
                  </pre>
                </details>
              )}
            </div>
          )}

          {/* Quick Test URLs */}
          <div className="border-t pt-4">
            <h4 className="text-sm font-medium mb-2">Quick Test URLs:</h4>
            <div className="space-y-1">
              {[
                'https://ticekt-demo-api.onrender.com/tickets',
                'https://jsonplaceholder.typicode.com/posts',
                'https://httpbin.org/json'
              ].map((url) => (
                <button
                  key={url}
                  onClick={() => setApiUrl(url)}
                  className="text-xs text-blue-600 hover:underline block"
                >
                  {url}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};