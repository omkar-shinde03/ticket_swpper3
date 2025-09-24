import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Eye, Download, Search, FileText, User } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

// Add a helper to check if the document belongs to an admin
function isAdminDocument(doc) {
  return doc.user_type === 'admin' || doc.kyc_status === 'admin'; // fallback if user_type is not present
}

export const DocumentsManagement = () => {
  const [documents, setDocuments] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const { toast } = useToast();

  useEffect(() => {
    loadAllDocuments();
  }, []);

  const loadAllDocuments = async () => {
    try {
      setIsLoading(true);
      // Load all documents with user profile info from the view
      const { data, error } = await supabase
        .from('user_documents_with_profile')
        .select('*')
        .order('uploaded_at', { ascending: false });

      if (error) {
        console.error('Error loading documents:', error);
        toast({
          title: "Error",
          description: "Failed to load documents.",
          variant: "destructive",
        });
        return;
      }

      setDocuments(data || []);
      
      // Debug: List all files in storage bucket
      try {
        const { data: storageFiles, error: storageError } = await supabase.storage
          .from('kyc-documents')
          .list('', { limit: 100 });
        
        if (storageError) {
          console.error('Error listing storage files:', storageError);
        } else {
          console.log('Available files in kyc-documents bucket:', storageFiles);
        }
      } catch (storageError) {
        console.error('Could not list storage files:', storageError);
      }
      
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "Failed to load documents.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const downloadDocument = async (documentUrl, fileName, storagePathFromDb) => {
    try {
      console.log('Downloading document with params:', { documentUrl, fileName, storagePathFromDb });
      
      // Use storagePathFromDb if available, otherwise use documentUrl
      let storagePath = storagePathFromDb || documentUrl;
      
      // If documentUrl is a full URL, extract the path after 'kyc-documents/'
      if (documentUrl && documentUrl.startsWith('http')) {
        const match = documentUrl.match(/kyc-documents\/([^?]+)/);
        storagePath = match ? match[1] : documentUrl;
      }
      
      // Clean up the storage path - remove any query parameters or extra paths
      if (storagePath && storagePath.includes('?')) {
        storagePath = storagePath.split('?')[0];
      }
      
      console.log('Using storage path:', storagePath);
      
      // First, check if the file exists in storage
      try {
        const { data: fileList, error: listError } = await supabase.storage
          .from('kyc-documents')
          .list('', {
            limit: 1000,
            offset: 0,
            search: storagePath
          });
        
        if (listError) {
          console.error('Error listing files:', listError);
        } else {
          console.log('Files in bucket:', fileList);
          const fileExists = fileList?.some(file => file.name === storagePath);
          if (!fileExists) {
            throw new Error(`File not found in storage: ${storagePath}`);
          }
        }
      } catch (listError) {
        console.log('Could not verify file existence:', listError);
      }
      
      // Method 1: Try signed URL first
      try {
        const { data: signedUrlData, error: signedUrlError } = await supabase.storage
          .from('kyc-documents')
          .createSignedUrl(storagePath, 60); // 60 seconds expiry
        
        if (!signedUrlError && signedUrlData?.signedUrl) {
          console.log('Using signed URL for download:', signedUrlData.signedUrl);
          const response = await fetch(signedUrlData.signedUrl);
          if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          const blob = await response.blob();
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = fileName;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          
          toast({
            title: "Success",
            description: "Document downloaded successfully.",
          });
          return;
        } else {
          console.error('Signed URL error:', signedUrlError);
        }
      } catch (signedUrlError) {
        console.log('Signed URL method failed:', signedUrlError);
      }
      
      // Method 2: Try direct download
      try {
        const { data, error } = await supabase.storage
          .from('kyc-documents')
          .download(storagePath);
          
        if (error) {
          console.error('Direct download error:', error);
          throw error;
        }
        
        const url = URL.createObjectURL(data);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        toast({
          title: "Success",
          description: "Document downloaded successfully.",
        });
        return;
      } catch (downloadError) {
        console.log('Direct download method failed:', downloadError);
      }
      
      // Method 3: Try public URL as last resort
      try {
        const { data: publicUrlData } = supabase.storage
          .from('kyc-documents')
          .getPublicUrl(storagePath);
        
        if (publicUrlData?.publicUrl) {
          console.log('Using public URL for download:', publicUrlData.publicUrl);
          const response = await fetch(publicUrlData.publicUrl);
          if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          const blob = await response.blob();
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = fileName;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          
          toast({
            title: "Success",
            description: "Document downloaded successfully.",
          });
          return;
        }
      } catch (publicUrlError) {
        console.log('Public URL method failed:', publicUrlError);
      }
      
      // If all methods failed, provide specific error message
      throw new Error(`File not found or inaccessible: ${storagePath}. Please check if the file exists in storage.`);
      
    } catch (error) {
      console.error('Error downloading document:', error);
      toast({
        title: "Error",
        description: `Failed to download document: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  const filteredDocuments = documents.filter(doc => 
    doc.document_type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const aadharDocuments = filteredDocuments.filter(doc => 
    doc.document_type?.toLowerCase().includes('aadhar') || 
    doc.document_type?.toLowerCase().includes('aadhaar')
  );

  return (
    <div className="space-y-6">
      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Documents</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{documents.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Aadhar Cards</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{aadharDocuments.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending Verification</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {documents.filter(doc => doc.kyc_status === 'pending').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Verified Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {documents.filter(doc => doc.kyc_status === 'verified').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Documents Table */}
      <Card>
        <CardHeader>
          <CardTitle>All User Documents</CardTitle>
          <CardDescription>
            Complete access to all documents uploaded by users including Aadhar cards
          </CardDescription>
          <div className="flex items-center space-x-2 mt-4">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by document type, user name, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Loading documents...</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Document Type</TableHead>
                  <TableHead>KYC Status</TableHead>
                  <TableHead>Uploaded</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDocuments.map((doc) => {
                  const isAdmin = doc.user_type === 'admin';
                  const kycStatus = isAdmin ? 'verified' : doc.kyc_status;
                  return (
                    <TableRow key={doc.id}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="font-medium">{doc.full_name || 'Unknown'}</p>
                            <p className="text-xs text-muted-foreground">{doc.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <FileText className="h-4 w-4" />
                          <span className="font-medium">{doc.document_type}</span>
                          {doc.document_type?.toLowerCase().includes('aadhar') && (
                            <Badge variant="secondary" className="text-xs">Aadhar</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant="outline" 
                          className={
                            kycStatus === 'verified' 
                              ? 'text-green-700 bg-green-100' 
                              : kycStatus === 'rejected'
                              ? 'text-red-700 bg-red-100'
                              : 'text-yellow-700 bg-yellow-100'
                          }
                        >
                          {kycStatus || 'pending'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {formatDistanceToNow(new Date(doc.uploaded_at), { addSuffix: true })}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => downloadDocument(
                              doc.file_url,
                              `${doc.document_type}_${doc.full_name || 'unknown'}.pdf`,
                              doc.storage_path
                            )}
                          >
                            <Download className="h-4 w-4 mr-1" />
                            Download
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {filteredDocuments.length === 0 && !isLoading && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      <div className="text-muted-foreground">
                        {searchTerm ? 'No documents found matching your search.' : 'No documents uploaded yet.'}
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};