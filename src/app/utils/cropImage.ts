import { Area } from 'react-easy-crop';

/**
 * Crops the image using canvas and returns a base64-encoded image with transparent background.
 */
export default function getCroppedImg(imageSrc: string, crop: Area): Promise<string> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.src = imageSrc;

    image.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = crop.width;
      canvas.height = crop.height;

      const ctx = canvas.getContext('2d');
      if (!ctx) return reject(new Error('Failed to get canvas context'));

      // Clear the canvas to ensure transparency
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw cropped image
      ctx.drawImage(
        image,
        crop.x,
        crop.y,
        crop.width,
        crop.height,
        0,
        0,
        crop.width,
        crop.height
      );

      // Export as PNG to preserve transparency
      canvas.toBlob((blob) => {
        if (!blob) return reject(new Error('Canvas is empty'));
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      }, 'image/png');
    };

    image.onerror = (err) => reject(err);
  });
}
