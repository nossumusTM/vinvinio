// // 'use client';

// // import { CldUploadWidget } from "next-cloudinary";
// // import Image from "next/image";
// // import { useCallback } from "react";
// // import { TbPhotoPlus } from 'react-icons/tb'

// // declare global {
// //     var cloudinary: any
// // }

// // const uploadPreset = "lvnuxui";

// // interface ImageUploadProps {
// //     onChange: (value: string) => void;
// //     value: string;
// // }

// // const ImageUpload: React.FC<ImageUploadProps> = ({
// //     onChange,
// //     value
// // }) => {
// //     const handleUpload = useCallback((result: any) => {
// //         onChange(result.info.secure_url);
// //     }, [onChange]);

// //     return (
// //         <CldUploadWidget
// //             onUpload={handleUpload}
// //             uploadPreset={uploadPreset}
// //             options={{
// //                 maxFiles: 1
// //             }}
// //         >
// //             {({ open }) => {
// //                 return (
// //                     <div
// //                         onClick={() => open?.()}
// //                         className="
// //               relative
// //               cursor-pointer
// //               hover:opacity-70
// //               transition
// //               border-dashed 
// //               border-2 
// //               p-20 
// //               border-neutral-300
// //               flex
// //               flex-col
// //               justify-center
// //               items-center
// //               gap-4
// //               text-neutral-600
// //             "
// //                     >
// //                         <TbPhotoPlus
// //                             size={50}
// //                         />
// //                         <div className="font-semibold text-lg">
// //                             Click to upload
// //                         </div>
// //                         {value && (
// //                             <div className="
// //               absolute inset-0 w-full h-full">
// //                                 <Image
// //                                     fill
// //                                     style={{ objectFit: 'cover' }}
// //                                     src={value}
// //                                     alt="House"
// //                                 />
// //                             </div>
// //                         )}
// //                     </div>
// //                 )
// //             }}
// //         </CldUploadWidget>
// //     );
// // }

// // export default ImageUpload;

// 'use client';

// import { CldUploadWidget } from 'next-cloudinary';
// import Image from 'next/image';
// import { useCallback } from 'react';
// import { TbPhotoPlus } from 'react-icons/tb';

// declare global {
//   var cloudinary: any;
// }

// const uploadPreset = 'lvnuxui';

// interface ImageUploadProps {
//     onChange: (value: string[]) => void;
//     value: string[];
//     multiple?: boolean;
//     maxImages?: number;
//     maxVideoSizeMB?: number;
// }  

// const ImageUpload: React.FC<ImageUploadProps> = ({
//   onChange,
//   value = [],
//   maxImages = 10,
//   maxVideoSizeMB = 30,
// }) => {
//   const handleUpload = useCallback(
//     (result: any) => {
//       const newUrl = result.info.secure_url;
//       if (result.info.resource_type === 'video' && result.info.bytes > maxVideoSizeMB * 1024 * 1024) {
//         alert(`Video exceeds ${maxVideoSizeMB}MB size limit`);
//         return;
//       }

//       const updated = [...value, newUrl].slice(0, maxImages);
//       onChange(updated);
//     },
//     [onChange, value, maxImages, maxVideoSizeMB]
//   );

//   return (
//     <CldUploadWidget
//       onUpload={handleUpload}
//       uploadPreset={uploadPreset}
//       options={{
//         maxFiles: maxImages,
//         resourceType: 'auto',
//         sources: ['local', 'url', 'camera'],
//       }}
//     >
//       {({ open }) => {
//         return (
//           <div>
//             <div
//               onClick={() => open?.()}
//               className="
//                 relative
//                 cursor-pointer
//                 hover:opacity-70
//                 transition
//                 border-dashed 
//                 border-2 
//                 p-10 
//                 border-neutral-300
//                 flex
//                 flex-col
//                 justify-center
//                 items-center
//                 gap-4
//                 text-neutral-600
//               "
//             >
//               <TbPhotoPlus size={50} />
//               <div className="font-semibold text-lg">Click to upload</div>
//               <p className="text-xs text-neutral-500">
//                 Upload up to {maxImages} images and 1 video (max {maxVideoSizeMB}MB)
//               </p>
//             </div>

//             {value?.length > 0 && (
//               <div className="grid grid-cols-3 gap-3 mt-4">
//                 {value.map((url, idx) => (
//                   <div key={idx} className="relative w-full h-40 rounded overflow-hidden">
//                     <Image
//                       src={url}
//                       alt={`upload-${idx}`}
//                       fill
//                       className="object-cover"
//                     />
//                   </div>
//                 ))}
//               </div>
//             )}
//           </div>
//         );
//       }}
//     </CldUploadWidget>
//   );
// };

// export default ImageUpload;

'use client';

import Image from 'next/image';
import { useCallback, useEffect, useRef, useState } from 'react';
import { TbPhotoPlus } from 'react-icons/tb';
import Sortable from 'sortablejs';
import toast from 'react-hot-toast';
import clsx from 'clsx';

const uploadPreset = 'vuolapreset';
const cloudName = 'dlomv0hbe';

interface ImageUploadProps {
  onChange: (value: string[]) => void;
  value: string[];
  maxImages?: number;
  maxVideoSizeMB?: number;
}

const ImageUpload: React.FC<ImageUploadProps> = ({
  onChange,
  value = [],
  maxImages = 10,
  maxVideoSizeMB = 30,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [loadedState, setLoadedState] = useState<Record<string, boolean>>({});

  const handleFiles = async (files: FileList | null) => {
    if (!files) return;

    const currentCount = value.length;
    const remaining = maxImages - currentCount;

    const selectedFiles = Array.from(files).slice(0, remaining);

    const newUploads: string[] = [];

    setIsUploading(true);

    const hasVideo = value.some(v => v.includes('.mp4') || v.includes('video'));

    for (const file of selectedFiles) {
      const isVideo = file.type.startsWith('video');

      // ✅ Restrict to only one video
      if (isVideo) {
        const alreadyHasVideo = [...value, ...newUploads].some(v => v.includes('.mp4') || v.includes('video'));
        if (alreadyHasVideo) {
          toast.error('You can only upload one video per experience.');
          continue;
        }

        if (file.size > maxVideoSizeMB * 1024 * 1024) {
          toast.error(`Video exceeds ${maxVideoSizeMB}MB size limit`);
          continue;
        }
      }

      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', uploadPreset);

      try {
        const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`, {
          method: 'POST',
          body: formData,
        });

        const data = await res.json();
        const secureUrl = data.secure_url;

        if (secureUrl && typeof secureUrl === 'string') {
          newUploads.push(secureUrl);
        }

      } catch (error) {
        console.error('Upload error:', error);
        toast.error('Failed to upload file.');
      }
    }

    // ⏬ Apply all at once after loop
    const merged = [...value, ...newUploads].slice(0, maxImages);
    onChange(merged);

    setIsUploading(false);
  };

  useEffect(() => {
    if (previewRef.current) {
      Sortable.create(previewRef.current, {
        animation: 150,
        onEnd: (evt) => {
          const reordered = [...value];
          const [moved] = reordered.splice(evt.oldIndex!, 1);
          reordered.splice(evt.newIndex!, 0, moved);
          onChange(reordered);
        },
      });
    }
  }, [value, onChange]);

  return (
    <div className="flex flex-col gap-4">
      <input
        type="file"
        accept="image/*,video/*"
        multiple
        hidden
        ref={inputRef}
        onChange={(e) => handleFiles(e.target.files)}
      />

      <div
        onClick={() => inputRef.current?.click()}
        className="
          relative
          cursor-pointer
          hover:opacity-70
          rounded-xl
          transition
          border-dashed 
          border-2 
          p-10 
          border-neutral-300
          flex
          flex-col
          justify-center
          items-center
          gap-4
          text-neutral-600
        "
      >
        <TbPhotoPlus size={50} />
        <div className="font-semibold text-lg">Click to upload</div>
        <p className="text-xs text-neutral-500">
          Upload up to {maxImages} images and 1 video (max {maxVideoSizeMB}MB)
        </p>
      </div>

      {Array.isArray(value) && value.length > 0 && (
        <div ref={previewRef} className="grid grid-cols-3 gap-3 mt-4">
          {value.map((url, idx) => {
            const isVideo = url.includes('.mp4') || url.includes('video');

            return (
              <div
                key={url}
                className="relative w-full h-40 overflow-hidden rounded-xl bg-neutral-100 shadow-lg shadow-neutral-300/60 transition-transform duration-300 hover:-translate-y-0.5"
              >
                {isVideo ? (
                  <video
                    src={url}
                    controls
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <Image
                    src={url}
                    alt={`upload-${idx}`}
                    fill
                    loading="lazy"
                    onLoadingComplete={() =>
                      setLoadedState((prev) => ({ ...prev, [url]: true }))
                    }
                    className={clsx(
                      'object-cover transition-opacity duration-500 ease-out',
                      loadedState[url] ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                )}

                {idx === 0 && (
                  <span className="absolute top-1 left-1 bg-black text-white text-xs px-2 py-0.5 rounded">
                    Cover
                  </span>
                )}

                {/* ❌ Remove Button */}
                <button
                  type="button"
                  onClick={() => {
                    const updated = value.filter((v) => v !== url);
                    onChange(updated);
                    setLoadedState((prev) => {
                      if (!(url in prev)) return prev;
                      const next = { ...prev };
                      delete next[url];
                      return next;
                    });
                  }}
                  className="absolute top-1 right-1 bg-white rounded-full text-black hover:bg-neutral-100 pl-2 pr-2 shadow"
                  aria-label="Remove"
                >
                  ×
                </button>
              </div>
            );
          })}
        </div>
      )}

      {isUploading && (
        <div className="flex justify-center items-center mt-4">
          <span className="loader inline-block w-5 h-5 mt-1 border-2 border-t-transparent border-black rounded-full animate-spin" />
        </div>
      )}

    </div>
  );
};

export default ImageUpload;