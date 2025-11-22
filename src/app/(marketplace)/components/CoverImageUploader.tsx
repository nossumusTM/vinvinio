"use client";

import { useCallback, useRef, useState } from "react";
import Cropper from "react-easy-crop";
import getCroppedImg from "@/app/(marketplace)/utils/cropImage";

interface CoverImageUploaderProps {
  onUpload: (croppedDataUrl: string) => Promise<void> | void;
  onPreviewChange?: (dataUrl: string | null) => void;
  onUploadStart?: () => void;
  onUploadEnd?: () => void;
  onUploadError?: (error: unknown) => void;
  renderTrigger: (actions: { open: () => void; uploading: boolean }) => React.ReactNode;
  aspect?: number;
  disabled?: boolean;
}

const fileToDataURL = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

const CoverImageUploader = ({
  onUpload,
  onPreviewChange,
  onUploadStart,
  onUploadEnd,
  onUploadError,
  renderTrigger,
  aspect = 16 / 9,
  disabled,
}: CoverImageUploaderProps) => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isCropping, setIsCropping] = useState(false);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [uploading, setUploading] = useState(false);

  const open = () => {
    if (disabled || uploading) return;
    inputRef.current?.click();
  };

  const handleSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const dataUrl = await fileToDataURL(file);
    setUploadedImage(dataUrl);
    setIsCropping(true);
    setZoom(1);
    setCrop({ x: 0, y: 0 });
    setCroppedAreaPixels(null);

    // allow selecting the same file again later
    e.target.value = "";
  }, []);

  const onCropComplete = (_: any, area: any) => setCroppedAreaPixels(area);

  const handleCancel = () => {
    setIsCropping(false);
    setUploadedImage(null);
    setCroppedAreaPixels(null);
  };

  const handleSave = async () => {
    if (!uploadedImage || !croppedAreaPixels) return;

    try {
      setUploading(true);
      onUploadStart?.();
      const croppedDataUrl = await getCroppedImg(uploadedImage, croppedAreaPixels);
      onPreviewChange?.(croppedDataUrl);
      await onUpload(croppedDataUrl);
      handleCancel();
    } catch (error) {
      console.error("Cover upload failed", error);
      onUploadError?.(error);
    } finally {
      setUploading(false);
      onUploadEnd?.();
    }
  };

  return (
    <>
      {renderTrigger({ open, uploading })}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleSelect}
      />

      {isCropping && uploadedImage && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="w-[92vw] max-w-[1000px] h-[68vh] relative rounded-xl shadow-lg overflow-hidden bg-transparent">
            <Cropper
              image={uploadedImage}
              crop={crop}
              zoom={zoom}
              aspect={aspect}
              cropShape="rect"
              showGrid
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
            />
          </div>

          <div className="flex gap-4 mt-4">
            <button
              onClick={handleSave}
              disabled={uploading}
              className="px-6 py-2 bg-black text-white rounded-xl hover:opacity-90 disabled:opacity-70"
            >
              {uploading ? "Saving…" : "Save"}
            </button>
            <button
              onClick={handleCancel}
              disabled={uploading}
              className="px-6 py-2 bg-gray-200 text-gray-800 rounded-xl hover:bg-gray-100 disabled:opacity-70"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default CoverImageUploader;