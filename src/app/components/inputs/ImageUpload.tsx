// 'use client';

// import { CldUploadWidget } from "next-cloudinary";
// import Image from "next/image";
// import { useCallback } from "react";
// import { TbPhotoPlus } from 'react-icons/tb'

// declare global {
//     var cloudinary: any
// }

// const uploadPreset = "lvnuxui";

// interface ImageUploadProps {
//     onChange: (value: string) => void;
//     value: string;
// }

// const ImageUpload: React.FC<ImageUploadProps> = ({
//     onChange,
//     value
// }) => {
//     const handleUpload = useCallback((result: any) => {
//         onChange(result.info.secure_url);
//     }, [onChange]);

//     return (
//         <CldUploadWidget
//             onUpload={handleUpload}
//             uploadPreset={uploadPreset}
//             options={{
//                 maxFiles: 1
//             }}
//         >
//             {({ open }) => {
//                 return (
//                     <div
//                         onClick={() => open?.()}
//                         className="
//               relative
//               cursor-pointer
//               hover:opacity-70
//               transition
//               border-dashed 
//               border-2 
//               p-20 
//               border-neutral-300
//               flex
//               flex-col
//               justify-center
//               items-center
//               gap-4
//               text-neutral-600
//             "
//                     >
//                         <TbPhotoPlus
//                             size={50}
//                         />
//                         <div className="font-semibold text-lg">
//                             Click to upload
//                         </div>
//                         {value && (
//                             <div className="
//               absolute inset-0 w-full h-full">
//                                 <Image
//                                     fill
//                                     style={{ objectFit: 'cover' }}
//                                     src={value}
//                                     alt="House"
//                                 />
//                             </div>
//                         )}
//                     </div>
//                 )
//             }}
//         </CldUploadWidget>
//     );
// }

// export default ImageUpload;

'use client';

import { CldUploadWidget } from 'next-cloudinary';
import Image from 'next/image';
import { useCallback } from 'react';
import { TbPhotoPlus } from 'react-icons/tb';

declare global {
  var cloudinary: any;
}

const uploadPreset = 'lvnuxui';

interface ImageUploadProps {
    onChange: (value: string[]) => void;
    value: string[];
    multiple?: boolean;
    maxImages?: number;
    maxVideoSizeMB?: number;
}  

const ImageUpload: React.FC<ImageUploadProps> = ({
  onChange,
  value = [],
  maxImages = 10,
  maxVideoSizeMB = 30,
}) => {
  const handleUpload = useCallback(
    (result: any) => {
      const newUrl = result.info.secure_url;
      if (result.info.resource_type === 'video' && result.info.bytes > maxVideoSizeMB * 1024 * 1024) {
        alert(`Video exceeds ${maxVideoSizeMB}MB size limit`);
        return;
      }

      const updated = [...value, newUrl].slice(0, maxImages);
      onChange(updated);
    },
    [onChange, value, maxImages, maxVideoSizeMB]
  );

  return (
    <CldUploadWidget
      onUpload={handleUpload}
      uploadPreset={uploadPreset}
      options={{
        maxFiles: maxImages,
        resourceType: 'auto',
        sources: ['local', 'url', 'camera'],
      }}
    >
      {({ open }) => {
        return (
          <div>
            <div
              onClick={() => open?.()}
              className="
                relative
                cursor-pointer
                hover:opacity-70
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

            {value?.length > 0 && (
              <div className="grid grid-cols-3 gap-3 mt-4">
                {value.map((url, idx) => (
                  <div key={idx} className="relative w-full h-40 rounded overflow-hidden">
                    <Image
                      src={url}
                      alt={`upload-${idx}`}
                      fill
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      }}
    </CldUploadWidget>
  );
};

export default ImageUpload;