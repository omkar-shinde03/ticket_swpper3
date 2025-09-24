import { supabase } from "@/integrations/supabase/client";

/**
 * Upload a file to Supabase storage using the upload-file edge function
 * @param {File} file - The file to upload
 * @param {string} bucket - The storage bucket name
 * @param {string} folder - Optional folder path
 * @returns {Promise<{success: boolean, url?: string, error?: string}>}
 */
export const uploadFile = async (file, bucket, folder = null) => {
  try {
    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      throw new Error('File size exceeds 10MB limit');
    }

    // Validate file type based on bucket
    const allowedTypes = {
      'kyc-documents': ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'],
      'ticket-images': ['image/jpeg', 'image/jpg', 'image/png'],
      'avatars': ['image/jpeg', 'image/jpg', 'image/png'],
      'message-attachments': ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf', 'text/plain']
    };

    if (allowedTypes[bucket] && !allowedTypes[bucket].includes(file.type)) {
      throw new Error(`File type ${file.type} not allowed for ${bucket}`);
    }

    // Convert file to base64
    const fileData = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const fileName = `${timestamp}_${randomString}_${file.name}`;

    // Call the upload-file edge function
    const { data, error } = await supabase.functions.invoke('upload-file', {
      body: {
        bucket,
        fileName,
        fileData,
        contentType: file.type,
        folder
      }
    });

    if (error) {
      throw new Error(error.message);
    }

    return {
      success: true,
      url: data.url,
      path: data.path,
      fileName
    };

  } catch (error) {
    console.error('File upload error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Upload KYC document
 * @param {File} file - The KYC document file
 * @param {string} documentType - Type of document (aadhar, pan, passport, driving_license)
 * @returns {Promise<{success: boolean, url?: string, error?: string}>}
 */
export const uploadKYCDocument = async (file, documentType) => {
  try {
    // Rename file to include document type
    const timestamp = Date.now();
    const fileName = `${documentType}_${timestamp}_${file.name}`;
    
    const renamedFile = new File([file], fileName, { type: file.type });
    
    return await uploadFile(renamedFile, 'kyc-documents');
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Upload ticket image
 * @param {File} file - The ticket image file
 * @param {string} ticketId - The ticket ID
 * @returns {Promise<{success: boolean, url?: string, error?: string}>}
 */
export const uploadTicketImage = async (file, ticketId) => {
  try {
    const timestamp = Date.now();
    const fileName = `ticket_${ticketId}_${timestamp}_${file.name}`;
    
    const renamedFile = new File([file], fileName, { type: file.type });
    
    return await uploadFile(renamedFile, 'ticket-images', ticketId);
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Upload user avatar
 * @param {File} file - The avatar image file
 * @returns {Promise<{success: boolean, url?: string, error?: string}>}
 */
export const uploadAvatar = async (file) => {
  try {
    const timestamp = Date.now();
    const fileName = `avatar_${timestamp}_${file.name}`;
    
    const renamedFile = new File([file], fileName, { type: file.type });
    
    return await uploadFile(renamedFile, 'avatars');
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Get file from storage
 * @param {string} bucket - The storage bucket name
 * @param {string} path - The file path
 * @returns {Promise<string>} - The public URL
 */
export const getFileUrl = (bucket, path) => {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
};

/**
 * Delete file from storage
 * @param {string} bucket - The storage bucket name
 * @param {string} path - The file path
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const deleteFile = async (bucket, path) => {
  try {
    const { error } = await supabase.storage.from(bucket).remove([path]);
    
    if (error) {
      throw new Error(error.message);
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
};