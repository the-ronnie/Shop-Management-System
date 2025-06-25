import type { NextApiRequest, NextApiResponse } from 'next';
import formidable from 'formidable';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

// Configuration for formidable - don't use Next.js body parser
export const config = {
  api: {
    bodyParser: false,
  },
};

// Helper function to convert relative paths to absolute URLs
function getAbsoluteUrl(relativePath: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  
  // Ensure the path starts with a slash
  const normalizedPath = relativePath.startsWith('/') ? relativePath : `/${relativePath}`;
  
  return `${baseUrl}${normalizedPath}`;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Create uploads directory if it doesn't exist
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Use a promise to properly handle the asynchronous form parsing
    const parseForm = async (): Promise<string[]> => {
      return new Promise((resolve, reject) => {
        const form = formidable({
          uploadDir,
          keepExtensions: true,
          maxFiles: 10,
          maxFileSize: 10 * 1024 * 1024, // 10MB
        });

        form.parse(req, (err, fields, files) => {
          if (err) {
            console.error('Upload error:', err);
            return reject(err);
          }

          const uploadedFiles: string[] = [];
          const fileField = files.files;

          // Check if files exist
          if (!fileField) {
            return resolve(uploadedFiles);
          }

          // Handle multiple files
          if (Array.isArray(fileField)) {
            for (const file of fileField) {
              if (!file) continue;

              const uniqueFilename = `${uuidv4()}${path.extname(file.originalFilename || '')}`;
              const newPath = path.join(uploadDir, uniqueFilename);

              try {
                fs.renameSync((file as formidable.File).filepath, newPath);
                // Store as absolute URL instead of relative path
                uploadedFiles.push(getAbsoluteUrl(`/uploads/${uniqueFilename}`));
              } catch (error) {
                console.error('File rename error:', error);
              }
            }
          }
          // Handle single file
          else if (typeof fileField === 'object' && 'filepath' in fileField) {
            const file = fileField as formidable.File;
            const uniqueFilename = `${uuidv4()}${path.extname(file.originalFilename || '')}`;
            const newPath = path.join(uploadDir, uniqueFilename);

            try {
              fs.renameSync(file.filepath, newPath);
              // Store as absolute URL instead of relative path
              uploadedFiles.push(getAbsoluteUrl(`/uploads/${uniqueFilename}`));
            } catch (error) {
              console.error('File rename error:', error);
            }
          }

          resolve(uploadedFiles);
        });
      });
    };

    // Wait for the form parsing to complete
    const uploadedFiles = await parseForm();
    
    // Log the uploaded files for debugging
    console.log('Uploaded files:', uploadedFiles);
    
    // Send response after files are processed
    return res.status(200).json({ files: uploadedFiles });
  } catch (error) {
    console.error('Upload handler error:', error);
    return res.status(500).json({ error: 'Upload failed' });
  }
}