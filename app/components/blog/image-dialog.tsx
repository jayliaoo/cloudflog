import { useState } from "react";
import { Upload, Link, X } from "lucide-react";

interface ImageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImageInsert: (url: string, altText: string) => void;
}

export default function ImageDialog({ open, onOpenChange, onImageInsert }: ImageDialogProps) {
  const [imageUrl, setImageUrl] = useState("");
  const [altText, setAltText] = useState("");
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [activeTab, setActiveTab] = useState<'url' | 'upload'>('url');

  const handleUrlSubmit = () => {
    if (imageUrl.trim()) {
      onImageInsert(imageUrl.trim(), altText.trim() || "Image");
      resetForm();
      onOpenChange(false);
    }
  };

  const handleFileUpload = async () => {
    if (!file) return;

    setUploading(true);
    try {
      // Step 1: Get signed URL and final URL from the API
      const signedUrlResponse = await fetch(
        `/api/images?action=getUploadUrl&filename=${encodeURIComponent(file.name)}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': file.type,
          },
        }
      );

      if (!signedUrlResponse.ok) {
        const errorData = await signedUrlResponse.json().catch(() => ({})) as { error?: string };
        throw new Error(errorData.error || `Failed to get upload URL: ${signedUrlResponse.status}`);
      }

      const { signedUrl, finalUrl, success } = await signedUrlResponse.json() as {
        success: boolean;
        signedUrl: string;
        finalUrl: string;
        objectKey: string;
      };

      if (!success || !signedUrl || !finalUrl) {
        throw new Error('Invalid response from upload URL endpoint');
      }

      // Step 2: Upload the file to the signed URL
      const uploadResponse = await fetch(signedUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
        },
      });

      if (!uploadResponse.ok) {
        throw new Error(`Upload failed: ${uploadResponse.status} ${uploadResponse.statusText}`);
      }

      // Step 3: Insert the final image URL into the content
      onImageInsert(finalUrl, altText.trim() || file.name);
      resetForm();
      onOpenChange(false);
    } catch (error) {
      console.error('Upload error:', error);
      // You could add user-facing error handling here, such as showing a toast notification
      alert(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setUploading(false);
    }
  };

  const resetForm = () => {
    setImageUrl("");
    setAltText("");
    setFile(null);
    setActiveTab('url');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      if (!altText) {
        setAltText(selectedFile.name.replace(/\.[^/.]+$/, ""));
      }
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50" 
        onClick={() => onOpenChange(false)}
      />
      
      {/* Dialog */}
      <div className="relative bg-white rounded-lg shadow-lg w-full max-w-md mx-4 p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Insert Image</h2>
          <button
            onClick={() => onOpenChange(false)}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="mb-4">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('url')}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === 'url'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Link className="h-4 w-4 inline mr-2" />
              URL
            </button>
            <button
              onClick={() => setActiveTab('upload')}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === 'upload'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Upload className="h-4 w-4 inline mr-2" />
              Upload
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="space-y-4">
          {activeTab === 'url' && (
            <div className="space-y-4">
              <div>
                <label htmlFor="imageUrl" className="block text-sm font-medium mb-2">
                  Image URL
                </label>
                <input
                  id="imageUrl"
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://example.com/image.jpg"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label htmlFor="altText" className="block text-sm font-medium mb-2">
                  Alt Text
                </label>
                <input
                  id="altText"
                  type="text"
                  value={altText}
                  onChange={(e) => setAltText(e.target.value)}
                  placeholder="Describe the image"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div className="flex gap-2 pt-4">
                <button
                  onClick={handleUrlSubmit}
                  disabled={!imageUrl.trim()}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-md font-medium transition-colors"
                >
                  Insert Image
                </button>
                <button
                  onClick={() => onOpenChange(false)}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-md font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {activeTab === 'upload' && (
            <div className="space-y-4">
              <div>
                <label htmlFor="fileUpload" className="block text-sm font-medium mb-2">
                  Choose File
                </label>
                <input
                  id="fileUpload"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {file && (
                  <p className="text-sm text-gray-600 mt-1">
                    Selected: {file.name}
                  </p>
                )}
              </div>
              
              <div>
                <label htmlFor="uploadAltText" className="block text-sm font-medium mb-2">
                  Alt Text
                </label>
                <input
                  id="uploadAltText"
                  type="text"
                  value={altText}
                  onChange={(e) => setAltText(e.target.value)}
                  placeholder="Describe the image"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div className="flex gap-2 pt-4">
                <button
                  onClick={handleFileUpload}
                  disabled={!file || uploading}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-md font-medium transition-colors"
                >
                  {uploading ? "Uploading..." : "Upload & Insert"}
                </button>
                <button
                  onClick={() => onOpenChange(false)}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-md font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}