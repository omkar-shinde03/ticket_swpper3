import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { sendKYCEmail, testEmail, testCSP, testEmailJSTemplates, diagnoseEmailJS, findWorkingTemplate, testKYCEmailWithVideoLink, debugEmailJSTemplate, testNewTemplate, testFixedEmailRouting, debugEmailJSTemplateConfig } from '@/utils/emailService';

export const EmailTestComponent = () => {
  const [emailAddress, setEmailAddress] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [cspTestResult, setCspTestResult] = useState(null);
  const [templateTestResults, setTemplateTestResults] = useState(null);
  const [diagnosticResult, setDiagnosticResult] = useState(null);
  const [workingTemplate, setWorkingTemplate] = useState(null);
  const [fixedRoutingResult, setFixedRoutingResult] = useState(null);
  const [templateConfigResult, setTemplateConfigResult] = useState(null);
  const { toast } = useToast();

  const handleDiagnoseEmailJS = async () => {
    setIsLoading(true);
    try {
      const result = await diagnoseEmailJS();
      setDiagnosticResult(result);
      
      if (result.success) {
        toast({
          title: "EmailJS Diagnosis Passed! ✅",
          description: "EmailJS configuration is working correctly.",
        });
      } else {
        toast({
          title: "EmailJS Diagnosis Failed! ❌",
          description: `Error: ${result.error} (Status: ${result.status})`,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Diagnosis Error",
        description: `Error: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestCSP = async () => {
    setIsLoading(true);
    try {
      const result = await testCSP();
      setCspTestResult(result);
      
      if (result.success) {
        toast({
          title: "CSP Test Passed! ✅",
          description: "Content Security Policy allows EmailJS connections.",
        });
      } else {
        toast({
          title: "CSP Test Failed! ❌",
          description: result.message || "Content Security Policy is blocking EmailJS.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "CSP Test Error",
        description: `Error: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestTemplates = async () => {
    if (!emailAddress) {
      toast({
        title: "Error",
        description: "Please enter a test email address",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const results = await testEmailJSTemplates(emailAddress);
      setTemplateTestResults(results);
      
      const workingTemplates = results.filter(r => r.success);
      if (workingTemplates.length > 0) {
        toast({
          title: "Template Test Complete! ✅",
          description: `${workingTemplates.length} template(s) are working. Check results below.`,
        });
      } else {
        toast({
          title: "No Working Templates Found! ❌",
          description: "All templates failed. Check your EmailJS configuration.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Template Test Error",
        description: `Error: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestFixedRouting = async () => {
    if (!emailAddress) {
      toast({
        title: "Error",
        description: "Please enter a test email address",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const result = await testFixedEmailRouting(emailAddress);
      setFixedRoutingResult(result);
      
      if (result.success) {
        toast({
          title: "Fixed Routing Test Complete! ✅",
          description: `Test email sent using ${result.method} method. Check your inbox at ${emailAddress}`,
        });
      } else {
        toast({
          title: "Fixed Routing Test Failed! ❌",
          description: `Error: ${result.error}`,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Fixed Routing Test Error",
        description: `Error: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDebugTemplateConfig = async () => {
    if (!emailAddress) {
      toast({
        title: "Error",
        description: "Please enter a test email address",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const result = await debugEmailJSTemplateConfig(emailAddress);
      setTemplateConfigResult(result);
      
      if (result.success) {
        toast({
          title: "Template Config Debug Complete! 🔍",
          description: "Template configuration analyzed. Check results below.",
        });
      } else {
        toast({
          title: "Template Config Debug Failed! ❌",
          description: "Could not analyze template configuration.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Template Config Debug Error",
        description: `Error: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestEmail = async () => {
    if (!emailAddress) {
      toast({
        title: "Error",
        description: "Please enter a test email address",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const result = await testEmail(emailAddress);
      
      if (result.success) {
        toast({
          title: "Success!",
          description: `Test email sent to ${emailAddress}. Check your inbox!`,
        });
      } else {
        toast({
          title: "Email Failed",
          description: `Error: ${result.error}`,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: `Exception: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestKYCEmail = async () => {
    if (!emailAddress) {
      toast({
        title: "Error",
        description: "Please enter a test email address",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const videoLink = 'https://meet.jit.si/test-kyc-call-' + Date.now();
      const result = await sendKYCEmail(emailAddress, videoLink);
      
      if (result.success) {
        toast({
          title: "Success!",
          description: `KYC email sent to ${emailAddress}. Check your inbox!`,
        });
      } else {
        toast({
          title: "Email Failed",
          description: `Error: ${result.error}`,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: `Exception: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestKYCEmailWithVideoLink = async () => {
    if (!emailAddress) {
      toast({
        title: "Error",
        description: "Please enter a test email address",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const result = await testKYCEmailWithVideoLink(emailAddress);
      
      if (result.success) {
        toast({
          title: "Success! 🎥",
          description: `KYC email with video link sent to ${emailAddress}. Check your inbox!`,
        });
      } else {
        toast({
          title: "Email Failed",
          description: `Error: ${result.error}`,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: `Exception: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFindWorkingTemplate = async () => {
    setIsLoading(true);
    try {
      const templateId = await findWorkingTemplate();
      setWorkingTemplate(templateId);
      
      if (templateId) {
        toast({
          title: "Working Template Found! ✅",
          description: `Template ID: ${templateId}`,
        });
      } else {
        toast({
          title: "No Working Templates Found! ❌",
          description: "You may need to create a template in EmailJS dashboard",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Template Search Error",
        description: `Error: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDebugTemplate = async () => {
    if (!emailAddress) {
      toast({
        title: "Error",
        description: "Please enter a test email address",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const results = await debugEmailJSTemplate(emailAddress);
      
      const successCount = results.filter(r => r.success).length;
      if (successCount > 0) {
        toast({
          title: "Debug Complete! 🔍",
          description: `${successCount}/${results.length} test cases succeeded. Check console for details.`,
        });
      } else {
        toast({
          title: "All Debug Tests Failed! ❌",
          description: "Check console for detailed error information.",
          variant: "destructive",
        });
      }
      
      console.log('🔍 Debug Results:', results);
    } catch (error) {
      toast({
        title: "Debug Error",
        description: `Error: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestNewTemplate = async () => {
    if (!emailAddress) {
      toast({
        title: "Error",
        description: "Please enter a test email address",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const result = await testNewTemplate(emailAddress);
      
      if (result.success) {
        toast({
          title: "New Template Test Success! 🎯",
          description: `Email sent to ${emailAddress} using new template. Check inbox!`,
        });
      } else {
        toast({
          title: "New Template Test Failed! ❌",
          description: `Error: ${result.error}`,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "New Template Test Error",
        description: `Error: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Email Test Component</CardTitle>
        <CardDescription>
          Test EmailJS integration before using KYC functionality
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* CSP Test Section */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Content Security Policy Test</Label>
          <Button 
            onClick={handleTestCSP} 
            disabled={isLoading}
            variant="outline"
            className="w-full"
          >
            {isLoading ? 'Testing...' : 'Test CSP for EmailJS'}
          </Button>
          {cspTestResult && (
            <div className={`p-3 rounded-md text-sm ${
              cspTestResult.success 
                ? 'bg-green-50 text-green-700 border border-green-200' 
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}>
              <strong>{cspTestResult.success ? '✅ ' : '❌ '}</strong>
              {cspTestResult.message}
              {cspTestResult.cspError && (
                <div className="mt-2 text-xs">
                  <strong>Solution:</strong> Add these to your CSP connect-src:
                  <code className="block mt-1 bg-gray-100 p-1 rounded">
                    https://api.emailjs.com https://*.emailjs.com
                  </code>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Template Test Section */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">EmailJS Template Test</Label>
          <Button 
            onClick={handleTestTemplates} 
            disabled={isLoading}
            variant="outline"
            className="w-full"
          >
            {isLoading ? 'Testing...' : 'Test All EmailJS Templates'}
          </Button>
          {templateTestResults && (
            <div className="space-y-2">
              {templateTestResults.map((result, index) => (
                <div key={index} className={`p-2 rounded-md text-xs ${
                  result.success 
                    ? 'bg-green-50 text-green-700 border border-green-200' 
                    : 'bg-red-50 text-red-700 border border-red-200'
                }`}>
                  <strong>{result.template}:</strong> {result.success ? '✅ Working' : `❌ ${result.error}`}
                  {result.status && <span className="ml-2">(Status: {result.status})</span>}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Diagnostic Test Section */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">EmailJS Diagnostic Test</Label>
          <Button 
            onClick={handleDiagnoseEmailJS} 
            disabled={isLoading}
            variant="outline"
            className="w-full"
          >
            {isLoading ? 'Diagnosing...' : 'Run EmailJS Diagnostic'}
          </Button>
          {diagnosticResult && (
            <div className={`p-3 rounded-md text-sm ${
              diagnosticResult.success 
                ? 'bg-green-50 text-green-700 border border-green-200' 
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}>
              <strong>{diagnosticResult.success ? '✅ ' : '❌ '}</strong>
              {diagnosticResult.message}
              {diagnosticResult.error && (
                <div className="mt-2 text-xs">
                  <strong>Error:</strong> {diagnosticResult.error}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Working Template Finder Section */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Find Working EmailJS Template</Label>
          <Button 
            onClick={handleFindWorkingTemplate} 
            disabled={isLoading}
            variant="outline"
            className="w-full"
          >
            {isLoading ? 'Searching...' : 'Find Working EmailJS Template'}
          </Button>
          {workingTemplate && (
            <div className="p-3 rounded-md text-sm bg-blue-50 text-blue-700 border border-blue-200">
              <strong>Working Template ID:</strong> {workingTemplate}
            </div>
          )}
        </div>

        {/* Debug Template Section */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Debug EmailJS Template Variables</Label>
          <Button 
            onClick={handleDebugTemplate} 
            disabled={isLoading}
            variant="outline"
            className="w-full"
          >
            {isLoading ? 'Debugging...' : 'Debug Template Variables'}
          </Button>
          <div className="text-xs text-gray-500">
            Tests different parameter combinations to find what your template expects
          </div>
        </div>

        {/* New Template Test Section */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Test New EmailJS Template</Label>
          <Button 
            onClick={handleTestNewTemplate} 
            disabled={isLoading}
            variant="outline"
            className="w-full"
          >
            {isLoading ? 'Testing...' : 'Test New EmailJS Template'}
          </Button>
          {/* Add a placeholder for the new template test result if needed */}
        </div>

                 {/* Fixed Routing Test Section */}
         <div className="space-y-2">
           <Label className="text-sm font-medium">Test Fixed Email Routing</Label>
           <Button 
             onClick={handleTestFixedRouting} 
             disabled={isLoading}
             variant="outline"
             className="w-full"
           >
             {isLoading ? 'Testing...' : 'Test Fixed Email Routing'}
           </Button>
           {fixedRoutingResult && (
             <div className={`p-3 rounded-md text-sm ${
               fixedRoutingResult.success 
                 ? 'bg-green-50 text-green-700 border border-green-200' 
                 : 'bg-red-50 text-red-700 border border-red-200'
             }`}>
               <strong>{fixedRoutingResult.success ? '✅ ' : '❌ '}</strong>
               {fixedRoutingResult.message}
               {fixedRoutingResult.error && (
                 <div className="mt-2 text-xs">
                   <strong>Error:</strong> {fixedRoutingResult.error}
                 </div>
               )}
             </div>
           )}
         </div>

         {/* Template Configuration Debug Section */}
         <div className="space-y-2">
           <Label className="text-sm font-medium">Debug Template Configuration</Label>
           <Button 
             onClick={handleDebugTemplateConfig} 
             disabled={isLoading}
             variant="outline"
             className="w-full"
           >
             {isLoading ? 'Debugging...' : 'Debug Template Configuration'}
           </Button>
           {templateConfigResult && (
             <div className="p-3 rounded-md text-sm bg-blue-50 text-blue-700 border border-blue-200">
               <strong>🔍 Template Config Analysis:</strong>
               <div className="mt-2 space-y-1">
                 {templateConfigResult.recommendations.map((rec, index) => (
                   <div key={index} className="text-xs">{rec}</div>
                 ))}
               </div>
               {templateConfigResult.results && (
                 <details className="mt-2">
                   <summary className="cursor-pointer text-xs font-medium">View Detailed Results</summary>
                   <div className="mt-1 space-y-1">
                     {templateConfigResult.results.map((result, index) => (
                       <div key={index} className="text-xs">
                         <strong>{result.test}:</strong> {result.success ? '✅' : '❌'} {result.note}
                       </div>
                     ))}
                   </div>
                 </details>
               )}
             </div>
           )}
         </div>

        <div className="space-y-2">
          <Label htmlFor="test-email">Test Email Address</Label>
          <Input
            id="test-email"
            type="email"
            placeholder="your-email@example.com"
            value={emailAddress}
            onChange={(e) => setEmailAddress(e.target.value)}
          />
        </div>
        
        <div className="space-y-2">
          <Button 
            onClick={handleTestEmail} 
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? 'Sending...' : 'Send Test Email'}
          </Button>
          
          <Button 
            onClick={handleTestKYCEmail} 
            disabled={isLoading}
            variant="outline"
            className="w-full"
          >
            {isLoading ? 'Sending...' : 'Send Test KYC Email'}
          </Button>

          <Button 
            onClick={handleTestKYCEmailWithVideoLink} 
            disabled={isLoading}
            variant="outline"
            className="w-full"
          >
            {isLoading ? 'Sending...' : 'Send Test KYC Email with Video Link'}
          </Button>

          <Button 
            onClick={handleTestNewTemplate} 
            disabled={isLoading}
            variant="outline"
            className="w-full"
          >
            {isLoading ? 'Testing...' : 'Test New EmailJS Template 🎯'}
          </Button>
        </div>
        
        <div className="text-sm text-gray-600">
          <p>• <strong>CSP Test:</strong> Check if Content Security Policy allows EmailJS</p>
          <p>• <strong>Template Test:</strong> Test all available EmailJS templates</p>
          <p>• <strong>Diagnostic Test:</strong> Run a comprehensive check for EmailJS configuration issues</p>
          <p>• <strong>Find Working Template:</strong> Automatically discover the ID of a working EmailJS template</p>
          <p>• <strong>Debug Template Variables:</strong> Test different parameter combinations to find what your template expects</p>
          <p>• <strong>Test Email:</strong> Simple test message</p>
          <p>• <strong>KYC Email:</strong> Full KYC notification with video link</p>
          <p>• <strong>KYC Email with Video Link:</strong> Test the complete KYC email flow with video call link</p>
          <p>• <strong>Test New EmailJS Template:</strong> Test the new template with explicit recipient routing</p>
          <p>• <strong>Test Fixed Email Routing:</strong> Test if emails are sent to the correct recipient using fixed routing</p>
          <p>• Check your inbox after clicking any button</p>
        </div>
      </CardContent>
    </Card>
  );
};
