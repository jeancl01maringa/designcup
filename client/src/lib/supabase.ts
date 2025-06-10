import { createClient } from '@supabase/supabase-js';
import imageCompression from 'browser-image-compression';

// Get environment variables with fallback
const rawUrl = import.meta.env.VITE_SUPABASE_URL;
const rawKey = import.meta.env.VITE_SUPABASE_KEY;

// Clean quotes from environment variables if present
let supabaseUrl = '';
let supabaseAnonKey = '';

try {
  supabaseUrl = rawUrl ? rawUrl.replace(/^"(.*)"$/, '$1') : '';
  supabaseAnonKey = rawKey ? rawKey.replace(/^"(.*)"$/, '$1') : '';
} catch (error) {
  console.error('Error processing Supabase environment variables:', error);
}

// Fallback configuration if environment variables are not properly set
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Using fallback Supabase configuration');
  supabaseUrl = 'https://kmunxjuiuxaqitbovjls.supabase.co';
  supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImttdW54anVpdXhhcWl0Ym92amxzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU5MDIwNjYsImV4cCI6MjA2MTQ3ODA2Nn0.h-Sk_FnkNVQJOKE8nKkR8LhK3LO2f19S15eGWEuAr0M';
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Helper function to compress and convert image to WebP format
async function compressAndConvertToWebP(file: File): Promise<File> {
  try {
    // Compression options
    const options = {
      maxSizeMB: 1, // Maximum file size in MB
      maxWidthOrHeight: 1920, // Maximum width or height
      useWebWorker: true,
      fileType: 'image/webp' as const,
      initialQuality: 0.85, // 85% quality for good balance
    };

    // Compress and convert to WebP
    const compressedFile = await imageCompression(file, options);
    
    // Ensure the file has the correct WebP extension and name
    const webpFileName = file.name.replace(/\.[^/.]+$/, '.webp');
    const webpFile = new File([compressedFile], webpFileName, {
      type: 'image/webp',
      lastModified: Date.now()
    });

    console.log(`Image compressed: ${(file.size / 1024).toFixed(1)}KB → ${(webpFile.size / 1024).toFixed(1)}KB`);
    return webpFile;
  } catch (error) {
    console.error('Compression failed:', error);
    throw error;
  }
}

// Helper function for uploading files to Supabase Storage with category organization and WebP conversion
export async function uploadFileToSupabase(
  file: File, 
  bucket: string, 
  path: string,
  categoryName?: string
): Promise<{ url: string; error: null } | { url: null; error: string }> {
  try {
    let processedFile = file;
    let finalPath = path;
    
    // Compress and convert to WebP if it's an image
    if (file.type.startsWith('image/')) {
      try {
        console.log(`Compressing and converting ${file.name} to WebP...`);
        processedFile = await compressAndConvertToWebP(file);
        console.log(`Compression successful: ${processedFile.name}`);
        
        // Update path to use WebP extension
        finalPath = path.replace(/\.[^/.]+$/, '.webp');
      } catch (compressionError) {
        console.warn('Failed to compress/convert to WebP, using original file:', compressionError);
        // Continue with original file if compression fails
      }
    }

    // Organize by category if provided
    if (categoryName && bucket === 'images') {
      // Convert category name to folder-safe format
      const categoryFolder = categoryName.toLowerCase()
        .replace(/\s+/g, '-')           // spaces to hyphens
        .replace(/[^a-z0-9-]/g, '')     // remove special chars
        .replace(/-+/g, '-')            // multiple hyphens to single
        .replace(/^-|-$/g, '');         // remove leading/trailing hyphens
      
      // Extract filename from path
      const fileName = finalPath.split('/').pop() || finalPath;
      finalPath = `${categoryFolder}/${fileName}`;
    }

    console.log(`Uploading to Supabase: ${finalPath} (${(processedFile.size / 1024).toFixed(1)}KB)`);

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(finalPath, processedFile, {
        cacheControl: '3600',
        upsert: true
      });

    if (error) {
      return { url: null, error: error.message };
    }

    // Get the public URL
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(finalPath);

    console.log(`Upload successful: ${publicUrl}`);
    return { url: publicUrl, error: null };
  } catch (error) {
    return { 
      url: null, 
      error: error instanceof Error ? error.message : 'Unknown upload error' 
    };
  }
}

// Helper function to check Supabase connection
export async function checkSupabaseConnection(): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id')
      .limit(1);
    
    return !error;
  } catch (error) {
    console.error('Supabase connection check failed:', error);
    return false;
  }
}

// Helper function to ensure image bucket exists
export async function ensureImageBucket(bucketName: string = 'images'): Promise<boolean> {
  try {
    // Check if bucket exists
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('Error listing buckets:', listError);
      return false;
    }

    const bucketExists = buckets?.some(bucket => bucket.name === bucketName);
    
    if (bucketExists) {
      return true;
    }

    // Create bucket if it doesn't exist
    const { error: createError } = await supabase.storage.createBucket(bucketName, {
      public: true,
      allowedMimeTypes: ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/svg+xml'],
      fileSizeLimit: 10485760, // 10MB
    });

    if (createError) {
      console.error('Error creating bucket:', createError);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error ensuring image bucket:', error);
    return false;
  }
}