import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Upload, 
  File, 
  Image, 
  FileText, 
  Download, 
  Trash2, 
  Eye, 
  Check, 
  X,
  Search,
  Filter
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { sendEmail } from '@/utils/notifications';

const DocumentManagementSystem = () => {
  const [documents, setDocuments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const fileInputRef = useRef(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const { data, error } = await supabase
        .from('user_documents')
        .select(`
          *,
          profiles!user_documents_user_id_fkey(full_name, email)
        `)
        .order('uploaded_at', { ascending: false });

      if (error) throw error;
      setDocuments(data || []);
    } catch (error) {
      console.error('Error fetching documents:', error);
      toast({
        title: "Error",
        description: "Failed to fetch documents",
        variant: "destructive"
      });
    }
  };

  const handleFileUpload = async (event) => {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;

    setUploading(true);
    setUploadProgress(0);

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `documents/${fileName}`;

        // Upload to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('documents')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('documents')
          .getPublicUrl(filePath);

        // Save document record
        const { data: userData } = await supabase.auth.getUser();
        const userId = userData.user?.id;
        const userEmail = userData.user?.email;
        const { error: dbError } = await supabase
          .from('user_documents')
          .insert({
            user_id: userId,
            file_name: file.name,
            file_type: file.type,
            file_size: file.size,
            file_url: publicUrl,
            storage_path: filePath,
            verification_status: 'pending'
          });

        if (dbError) throw dbError;

        // Send video call link email after successful upload
        if (userEmail) {
          await sendEmail(
            userEmail,
            'Your Video Call Link',
            'video_call_link', // Use your actual template name
            {
              // Add any template data needed for the email
              link: `${window.location.origin}/video-call`,
              fileName: file.name
            }
          );
        }

        setUploadProgress(((i + 1) / files.length) * 100);
      }

      toast({
        title: "Upload Successful",
        description: `${files.length} file(s) uploaded successfully`,
      });

      fetchDocuments();
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Error uploading files:', error);
      toast({
        title: "Upload Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const verifyDocument = async (documentId, status, notes = '') => {
    try {
      const { error } = await supabase
        .from('user_documents')
        .update({
          verification_status: status,
          verified_at: status === 'approved' ? new Date().toISOString() : null,
          verification_notes: notes
        })
        .eq('id', documentId);

      if (error) throw error;

      toast({
        title: status === 'approved' ? "Document Approved" : "Document Rejected",
        description: `Document has been ${status}`,
        variant: status === 'approved' ? "default" : "destructive"
      });

      fetchDocuments();
    } catch (error) {
      console.error('Error verifying document:', error);
      toast({
        title: "Error",
        description: "Failed to update document status",
        variant: "destructive"
      });
    }
  };

  const deleteDocument = async (document) => {
    if (!confirm('Are you sure you want to delete this document?')) return;

    try {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('documents')
        .remove([document.storage_path]);

      if (storageError) throw storageError;

      // Delete from database
      const { error: dbError } = await supabase
        .from('user_documents')
        .delete()
        .eq('id', document.id);

      if (dbError) throw dbError;

      toast({
        title: "Document Deleted",
        description: "Document has been deleted successfully",
      });

      fetchDocuments();
    } catch (error) {
      console.error('Error deleting document:', error);
      toast({
        title: "Error",
        description: "Failed to delete document",
        variant: "destructive"
      });
    }
  };

  const downloadDocument = (document) => {
    window.open(document.file_url, '_blank');
  };

  const getFileIcon = (fileType) => {
    if (fileType?.startsWith('image/')) return <Image className="h-4 w-4" />;
    if (fileType?.includes('pdf')) return <FileText className="h-4 w-4" />;
    return <File className="h-4 w-4" />;
  };

  const getStatusBadge = (status) => {
    const variants = {
      pending: { variant: "outline", text: "Pending" },
      approved: { variant: "default", text: "Approved" },
      rejected: { variant: "destructive", text: "Rejected" }
    };
    
    const config = variants[status] || variants.pending;
    return <Badge variant={config.variant}>{config.text}</Badge>;
  };

  const formatFileSize = (bytes) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  // Helper to safely format dates
  const formatDateSafe = (dateString) => {
    const date = new Date(dateString);
    return dateString && !isNaN(date) ? date.toLocaleDateString() : 'Unknown';
  };

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.file_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || doc.verification_status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <File className="h-5 w-5" />
            Document Management System
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Upload Section */}
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
              onChange={handleFileUpload}
              className="hidden"
            />
            <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium mb-2">Upload Documents</h3>
            <p className="text-gray-600 mb-4">
              Drag and drop files here, or click to browse
            </p>
            <Button 
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? 'Uploading...' : 'Choose Files'}
            </Button>
            {uploading && (
              <div className="mt-4">
                <Progress value={uploadProgress} className="w-full" />
                <p className="text-sm text-gray-600 mt-2">{uploadProgress.toFixed(0)}% complete</p>
              </div>
            )}
          </div>

          {/* Search and Filter */}
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search documents..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border rounded-md"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          {/* Documents List */}
          <div className="space-y-3">
            {filteredDocuments.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No documents found
              </div>
            ) : (
              filteredDocuments.map((document) => (
                <div key={document.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                  <div className="flex items-center gap-3">
                    {getFileIcon(document.file_type)}
                    <div>
                      <h4 className="font-medium">{document.file_name}</h4>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <span>{document.profiles?.full_name}</span>
                        <span>•</span>
                        <span>{formatFileSize(document.file_size)}</span>
                        <span>•</span>
                        <span>{formatDateSafe(document.uploaded_at)}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {getStatusBadge(document.verification_status)}
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedDocument(document)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => downloadDocument(document)}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    
                    {document.verification_status === 'pending' && (
                      <>
                        <Button
                          size="sm"
                          onClick={() => verifyDocument(document.id, 'approved')}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => verifyDocument(document.id, 'rejected')}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteDocument(document)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Document Preview Dialog */}
      <Dialog open={selectedDocument !== null} onOpenChange={() => setSelectedDocument(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Document Preview - {selectedDocument?.file_name}</DialogTitle>
          </DialogHeader>
          
          {selectedDocument && (
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <p><strong>Uploaded by:</strong> {selectedDocument.profiles?.full_name}</p>
                  <p><strong>Size:</strong> {formatFileSize(selectedDocument.file_size)}</p>
                  <p><strong>Type:</strong> {selectedDocument.file_type}</p>
                  <p><strong>Status:</strong> {getStatusBadge(selectedDocument.verification_status)}</p>
                </div>
                <Button onClick={() => downloadDocument(selectedDocument)}>
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              </div>
              
              {selectedDocument.file_type?.startsWith('image/') ? (
                <img 
                  src={selectedDocument.file_url} 
                  alt={selectedDocument.file_name}
                  className="max-w-full max-h-96 object-contain mx-auto"
                />
              ) : (
                <iframe
                  src={selectedDocument.file_url}
                  className="w-full h-96 border rounded"
                  title={selectedDocument.file_name}
                />
              )}
              
              {selectedDocument.verification_notes && (
                <div className="p-3 bg-gray-100 rounded">
                  <strong>Verification Notes:</strong>
                  <p>{selectedDocument.verification_notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DocumentManagementSystem;