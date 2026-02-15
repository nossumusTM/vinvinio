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

const uploadPreset = 'vinvinpreset';
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
        const alreadyHasVideo = [...value, ...newUploads].some(
          (v) => typeof v === 'string' && (v.includes('.mp4') || v.includes('video')),
        );
        if (alreadyHasVideo) {
          toast.error('You can only upload one video per service.');
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

      <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
        {/* 🔼 Click to upload IN ALTO */}
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="
            relative w-full cursor-pointer
            rounded-xl border-2 border-dashed border-neutral-300
            bg-neutral-50/80 px-4 py-6
            text-center text-neutral-600
            transition hover:border-neutral-400 hover:bg-neutral-50
          "
        >
          <div className="flex flex-col items-center gap-3">
            <TbPhotoPlus size={40} />
            <div className="text-sm font-semibold">
              Click to upload
            </div>
            <p className="text-[11px] text-neutral-500">
              Upload up to {maxImages} images and 1 video (max{' '}
              {maxVideoSizeMB}MB)
            </p>
          </div>
        </button>

        {/* 🔽 Immagini caricate SOTTO il pulsante */}
        {Array.isArray(value) && value.length > 0 && (
          <div
            ref={previewRef}
            className="mt-4 grid grid-cols-3 gap-3"
          >
            {value.map((url, idx) => {
              if (typeof url !== 'string' || !url) return null;

              const isVideo =
                url.includes('.mp4') || url.includes('video');

              return (
                <div
                  key={url}
                  className="relative h-40 w-full overflow-hidden rounded-xl bg-neutral-100 shadow-lg shadow-neutral-300/60 transition-transform duration-300 hover:-translate-y-0.5"
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
                        setLoadedState((prev) => ({
                          ...prev,
                          [url]: true,
                        }))
                      }
                      className={clsx(
                        'object-cover transition-opacity duration-500 ease-out',
                        loadedState[url]
                          ? 'opacity-100'
                          : 'opacity-0',
                      )}
                    />
                  )}

                  {idx === 0 && (
                    <span className="absolute left-1 top-1 rounded bg-black px-2 py-0.5 text-xs text-white">
                      Cover
                    </span>
                  )}

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
                    className="absolute right-1 top-1 rounded-full bg-white px-2 text-black shadow hover:bg-neutral-100"
                    aria-label="Remove"
                  >
                    ×
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {isUploading && (
        <div className="mt-2 flex items-center justify-center">
          <span className="loader inline-block h-5 w-5 rounded-full border-2 border-black border-t-transparent animate-spin" />
        </div>
      )}
    </div>
  );

};

export default ImageUpload;
