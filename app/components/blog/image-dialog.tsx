import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "~/components/ui/dialog";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { Upload, Link, Image as ImageIcon } from "lucide-react";

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

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (imageUrl.trim()) {
      onImageInsert(imageUrl.trim(), altText.trim() || "Image");
      resetForm();
      onOpenChange(false);
    }
  };

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/images", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (response.ok && result.success) {
        onImageInsert(result.image.url, altText.trim() || result.image.originalName);
        resetForm();
        onOpenChange(false);
      } else {
        alert(result.error || "Failed to upload image");
      }
    } catch (error) {
      console.error("Upload error:", error);
      alert("Failed to upload image. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Clean up previous object URL if exists
      if (file) {
        URL.revokeObjectURL(URL.createObjectURL(file));
      }
      setFile(selectedFile);
      // Auto-generate alt text from filename
      const fileName = selectedFile.name.replace(/\.[^/.]+$/, ""); // Remove extension
      setAltText(fileName.replace(/[-_]/g, " ")); // Replace dashes and underscores with spaces
    }
  };

  const resetForm = () => {
    // Clean up object URL if exists
    if (file) {
      URL.revokeObjectURL(URL.createObjectURL(file));
    }
    setImageUrl("");
    setAltText("");
    setFile(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Insert Image</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="url" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="url">
              <Link className="h-4 w-4 mr-2" />
              URL
            </TabsTrigger>
            <TabsTrigger value="upload">
              <Upload className="h-4 w-4 mr-2" />
              Upload
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="url" className="space-y-4 mt-4">
            <form onSubmit={handleUrlSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="image-url">Image URL</Label>
                <Input
                  id="image-url"
                  type="url"
                  placeholder="https://example.com/image.jpg"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="alt-text">Alt Text</Label>
                <Input
                  id="alt-text"
                  type="text"
                  placeholder="Description of the image"
                  value={altText}
                  onChange={(e) => setAltText(e.target.value)}
                />
              </div>
              <div className="flex justify-end space-x-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={!imageUrl.trim()}>
                  Insert Image
                </Button>
              </div>
            </form>
          </TabsContent>
          
          <TabsContent value="upload" className="space-y-4 mt-4">
            <form onSubmit={handleFileUpload} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="image-file">Select Image</Label>
                <Input
                  id="image-file"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  required
                />
                <p className="text-sm text-muted-foreground">
                  Supported formats: JPEG, PNG, GIF, WebP. Max size: 5MB.
                </p>
              </div>
              
              {file && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Image Preview</Label>
                    <div className="border border-input rounded-md p-2 bg-muted/30">
                      <img 
                        src={URL.createObjectURL(file)} 
                        alt="Preview" 
                        className="max-w-full max-h-32 object-contain rounded mx-auto"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="upload-alt-text">Alt Text</Label>
                    <Input
                      id="upload-alt-text"
                      type="text"
                      placeholder="Description of the image"
                      value={altText}
                      onChange={(e) => setAltText(e.target.value)}
                    />
                  </div>
                </div>
              )}
              
              <div className="flex justify-end space-x-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={!file || uploading}>
                  {uploading ? "Uploading..." : "Upload & Insert"}
                </Button>
              </div>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}