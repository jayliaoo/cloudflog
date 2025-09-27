import { useState } from "react";
import { Upload, Link, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { calculateFileMD5 } from "~/utils/crypto.client";

interface ImageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImageInsert: (url: string, altText: string) => void;
}

export default function ImageDialog({
  open,
  onOpenChange,
  onImageInsert,
}: ImageDialogProps) {
  const [imageUrl, setImageUrl] = useState("");
  const [altText, setAltText] = useState("");
  const [uploading, setUploading] = useState(false);
  const [checkingDuplicate, setCheckingDuplicate] = useState(false);
  const [duplicateInfo, setDuplicateInfo] = useState<{
    exists: boolean;
    objectKey?: string;
    filename?: string;
  } | null>(null);
  const { t } = useTranslation();
  const [file, setFile] = useState<File | null>(null);
  const [activeTab, setActiveTab] = useState<"url" | "upload">("url");

  const handleUrlSubmit = () => {
    if (imageUrl.trim()) {
      onImageInsert(imageUrl.trim(), altText.trim() || "Image");
      resetForm();
      onOpenChange(false);
    }
  };

  const checkForDuplicate = async (file: File) => {
    setCheckingDuplicate(true);
    setDuplicateInfo(null);

    try {
      // Calculate MD5 hash on client side
      const md5Hash = await calculateFileMD5(file);

      // Check if duplicate exists
      const response = await fetch(
        `/api/images?md5=${encodeURIComponent(md5Hash)}`
      );

      if (!response.ok) {
        throw new Error(`Duplicate check failed: ${response.status}`);
      }

      const result = (await response.json()) as {
        exists: boolean;
        objectKey?: string;
        filename?: string;
        error?: string;
      };

      if (result.error) {
        throw new Error(result.error);
      }

      setDuplicateInfo(result);
      return result;
    } catch (error) {
      console.error("Duplicate check error:", error);
      // Continue with upload if duplicate check fails
      setDuplicateInfo({ exists: false });
      return { exists: false };
    } finally {
      setCheckingDuplicate(false);
    }
  };

  const handleFileUpload = async () => {
    if (!file) return;

    // If we haven't checked for duplicates yet, do it now
    let duplicateResult = duplicateInfo;
    if (!duplicateResult) {
      duplicateResult = await checkForDuplicate(file);
    }

    // If it's a duplicate, use the existing URL
    if (duplicateResult.exists && duplicateResult.objectKey) {
      onImageInsert(
        `/api/images/${duplicateResult.objectKey}`,
        altText.trim() || duplicateResult.filename || file.name
      );
      resetForm();
      onOpenChange(false);
      return;
    }

    // Proceed with upload for new images
    setUploading(true);
    try {
      // Create FormData with file and filename
      const formData = new FormData();
      formData.append("file", file);
      formData.append("filename", file.name);

      // Upload the new image
      const uploadResponse = await fetch("/api/images", {
        method: "POST",
        body: formData,
      });

      if (!uploadResponse.ok) {
        const errorData = (await uploadResponse.json().catch(() => ({}))) as {
          error?: string;
        };
        throw new Error(
          errorData.error || `Upload failed: ${uploadResponse.status}`
        );
      }

      const result = (await uploadResponse.json()) as {
        success: boolean;
        url: string;
        objectKey: string;
        duplicate?: boolean;
        message?: string;
      };

      if (!result.success) {
        throw new Error("Invalid response from upload endpoint");
      }

      // Insert the image URL into the content
      onImageInsert(
        `/api/images/${result.objectKey}`,
        altText.trim() || file.name
      );
      resetForm();
      onOpenChange(false);
    } catch (error) {
      console.error("Upload error:", error);
      alert(
        `Upload failed: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    } finally {
      setUploading(false);
    }
  };

  const resetForm = () => {
    setImageUrl("");
    setAltText("");
    setFile(null);
    setDuplicateInfo(null);
    setActiveTab("url");
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      if (!altText) {
        setAltText(selectedFile.name.replace(/\.[^/.]+$/, ""));
      }

      // Automatically check for duplicates when file is selected
      await checkForDuplicate(selectedFile);
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
          <h2 className="text-lg font-semibold">{t("editor.insertImage")}</h2>
          <button
            type="button"
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
              type="button"
              onClick={() => setActiveTab("url")}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === "url"
                  ? "border-b-2 border-blue-500 text-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <Link className="h-4 w-4 inline mr-2" />
              URL
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("upload")}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === "upload"
                  ? "border-b-2 border-blue-500 text-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <Upload className="h-4 w-4 inline mr-2" />
              {t("common.upload")}
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="space-y-4">
          {activeTab === "url" && (
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="imageUrl"
                  className="block text-sm font-medium mb-2"
                >
                  {t("common.image")} URL
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
                <label
                  htmlFor="altText"
                  className="block text-sm font-medium mb-2"
                >
                  Alt {t("common.text")}
                </label>
                <input
                  id="altText"
                  type="text"
                  value={altText}
                  onChange={(e) => setAltText(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  type="button"
                  onClick={handleUrlSubmit}
                  disabled={!imageUrl.trim()}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-md font-medium transition-colors"
                >
                  {t("editor.insertImage")}
                </button>
                <button
                  type="button"
                  onClick={() => onOpenChange(false)}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-md font-medium transition-colors"
                >
                  {t("common.cancel")}
                </button>
              </div>
            </div>
          )}

          {activeTab === "upload" && (
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="fileUpload"
                  className="block text-sm font-medium mb-2"
                >
                  {t("posts.chooseFile")}
                </label>
                <input
                  id="fileUpload"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="sdflj"
                  content="cursor-pointer"
                />
                {file && (
                  <div className="mt-1 space-y-1">
                    <p className="text-sm text-gray-600">
                      Selected: {file.name}
                    </p>
                    {checkingDuplicate && (
                      <p className="text-sm text-blue-600">
                        Checking for duplicates...
                      </p>
                    )}
                    {duplicateInfo && duplicateInfo.exists && (
                      <div className="p-2 bg-yellow-50 border border-yellow-200 rounded text-sm">
                        <p className="text-yellow-800 font-medium">
                          Duplicate found: {duplicateInfo.filename}
                        </p>
                        <p className="text-yellow-700">
                          This image already exists. Clicking upload will use
                          the existing image.
                        </p>
                      </div>
                    )}
                    {duplicateInfo && !duplicateInfo.exists && (
                      <p className="text-sm text-green-600">
                        New image - ready to upload
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label
                  htmlFor="uploadAltText"
                  className="block text-sm font-medium mb-2"
                >
                  Alt {t("common.text")}
                </label>
                <input
                  id="uploadAltText"
                  type="text"
                  value={altText}
                  onChange={(e) => setAltText(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  type="button"
                  onClick={handleFileUpload}
                  disabled={!file || uploading || checkingDuplicate}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-md font-medium transition-colors"
                >
                  {checkingDuplicate
                    ? "Checking..."
                    : uploading
                      ? t("common.uploading")
                      : duplicateInfo?.exists
                        ? "Use Existing Image"
                        : t("editor.uploadAndInsert")}
                </button>
                <button
                  type="button"
                  onClick={() => onOpenChange(false)}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-md font-medium transition-colors"
                >
                  {t("common.cancel")}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
