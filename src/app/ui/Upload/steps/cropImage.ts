// import { Area } from 'react-easy-crop';

// export default async function getCroppedImg(imageSrc: string, pixelCrop: Area): Promise<string> {
//   const image = await createImage(imageSrc);
//   const canvas = document.createElement('canvas');
//   canvas.width = pixelCrop.width;
//   canvas.height = pixelCrop.height;
//   const ctx = canvas.getContext('2d');

//   if (!ctx) throw new Error('No 2d context');

//   ctx.drawImage(
//     image,
//     pixelCrop.x,
//     pixelCrop.y,
//     pixelCrop.width,
//     pixelCrop.height,
//     0,
//     0,
//     pixelCrop.width,
//     pixelCrop.height
//   );

//   return new Promise((resolve, reject) => {
//     canvas.toBlob((blob) => {
//       if (!blob) {
//         reject(new Error('Canvas is empty'));
//         return;
//       }
//       const fileUrl = URL.createObjectURL(blob);
//       resolve(fileUrl);
//     }, 'image/jpeg');
//   });
// }

// function createImage(url: string): Promise<HTMLImageElement> {
//   return new Promise((resolve, reject) => {
//     const image = new window.Image();
//     image.addEventListener('load', () => resolve(image));
//     image.addEventListener('error', (error) => reject(error));
//     image.setAttribute('crossOrigin', 'anonymous');
//     image.src = url;
//   });
// }
