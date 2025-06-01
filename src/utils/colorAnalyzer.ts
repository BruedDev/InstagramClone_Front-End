// utils/colorAnalyzer.ts
export interface DominantColor {
  r: number;
  g: number;
  b: number;
}

export interface AdaptiveBackgroundStyle {
  background: string;
  backdropFilter?: string;
}

export interface BackgroundColorResult {
  backgroundColor: string;
  isLight: boolean;
  isDark: boolean;
}

export const getImageDominantColor = (imageElement: HTMLImageElement | HTMLVideoElement): Promise<DominantColor> => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      resolve({ r: 20, g: 20, b: 20 });
      return;
    }

    // Đợi element load xong
    const processImage = () => {
      try {
        let width: number, height: number;

        if (imageElement instanceof HTMLVideoElement) {
          // Đợi video có metadata
          if (imageElement.readyState < 2) {
            imageElement.addEventListener('loadeddata', processImage, { once: true });
            return;
          }
          width = imageElement.videoWidth || 320;
          height = imageElement.videoHeight || 240;
        } else {
          // Đợi image load
          if (!imageElement.complete || !imageElement.naturalWidth) {
            imageElement.addEventListener('load', processImage, { once: true });
            return;
          }
          width = imageElement.naturalWidth;
          height = imageElement.naturalHeight;
        }

        // Resize để optimize performance
        const maxSize = 50; // Nhỏ hơn để nhanh hơn
        const ratio = Math.min(maxSize / width, maxSize / height);
        canvas.width = Math.max(1, Math.floor(width * ratio));
        canvas.height = Math.max(1, Math.floor(height * ratio));

        ctx.drawImage(imageElement, 0, 0, canvas.width, canvas.height);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        // Sample từ edges (giống Facebook)
        const edgePixels: number[] = [];
        // Top và bottom edges
        for (let x = 0; x < canvas.width; x += Math.max(1, Math.floor(canvas.width / 10))) {
          // Top edge
          const topIndex = x * 4;
          if (topIndex < data.length) edgePixels.push(topIndex);

          // Bottom edge
          const bottomIndex = ((canvas.height - 1) * canvas.width + x) * 4;
          if (bottomIndex < data.length) edgePixels.push(bottomIndex);
        }

        // Left và right edges
        for (let y = 0; y < canvas.height; y += Math.max(1, Math.floor(canvas.height / 10))) {
          // Left edge
          const leftIndex = (y * canvas.width) * 4;
          if (leftIndex < data.length) edgePixels.push(leftIndex);

          // Right edge
          const rightIndex = (y * canvas.width + canvas.width - 1) * 4;
          if (rightIndex < data.length) edgePixels.push(rightIndex);
        }

        if (edgePixels.length === 0) {
          resolve({ r: 20, g: 20, b: 20 });
          return;
        }

        // Tính average color
        let totalR = 0, totalG = 0, totalB = 0;
        edgePixels.forEach(index => {
          totalR += data[index];
          totalG += data[index + 1];
          totalB += data[index + 2];
        });

        const avgR = Math.round(totalR / edgePixels.length);
        const avgG = Math.round(totalG / edgePixels.length);
        const avgB = Math.round(totalB / edgePixels.length);

        // Làm tối để tạo background phù hợp
        const factor = 0.4;
        resolve({
          r: Math.round(avgR * factor),
          g: Math.round(avgG * factor),
          b: Math.round(avgB * factor)
        });

      } catch (error) {
        console.error('Color analysis error:', error);
        resolve({ r: 20, g: 20, b: 20 });
      }
    };

    processImage();
  });
};

// Hàm mới để phát hiện background color cho slide
export const detectImageBackgroundColor = (imageElement: HTMLImageElement): Promise<BackgroundColorResult> => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      resolve({
        backgroundColor: '#000',
        isLight: false,
        isDark: true
      });
      return;
    }

    const processImage = () => {
      try {
        // Đợi image load
        if (!imageElement.complete || !imageElement.naturalWidth) {
          imageElement.addEventListener('load', processImage, { once: true });
          return;
        }

        const width = imageElement.naturalWidth;
        const height = imageElement.naturalHeight;

        // Resize nhỏ để phân tích nhanh
        const maxSize = 100;
        const ratio = Math.min(maxSize / width, maxSize / height);
        canvas.width = Math.max(1, Math.floor(width * ratio));
        canvas.height = Math.max(1, Math.floor(height * ratio));

        ctx.drawImage(imageElement, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        // Sample từ corners và edges để phát hiện background
        const backgroundPixels: number[] = [];

        // 4 góc
        backgroundPixels.push(0); // top-left
        backgroundPixels.push((canvas.width - 1) * 4); // top-right
        backgroundPixels.push(((canvas.height - 1) * canvas.width) * 4); // bottom-left
        backgroundPixels.push(((canvas.height - 1) * canvas.width + canvas.width - 1) * 4); // bottom-right

        // Edges với sample thưa
        const edgeSampleRate = Math.max(1, Math.floor(Math.min(canvas.width, canvas.height) / 8));

        // Top và bottom edges
        for (let x = 0; x < canvas.width; x += edgeSampleRate) {
          backgroundPixels.push(x * 4); // top
          backgroundPixels.push(((canvas.height - 1) * canvas.width + x) * 4); // bottom
        }

        // Left và right edges
        for (let y = 0; y < canvas.height; y += edgeSampleRate) {
          backgroundPixels.push((y * canvas.width) * 4); // left
          backgroundPixels.push((y * canvas.width + canvas.width - 1) * 4); // right
        }

        // Lọc bỏ index không hợp lệ
        const validPixels = backgroundPixels.filter(index => index < data.length);

        if (validPixels.length === 0) {
          resolve({
            backgroundColor: '#161616',
            isLight: false,
            isDark: true
          });
          return;
        }

        // Tính average color từ background pixels
        let totalR = 0, totalG = 0, totalB = 0;
        validPixels.forEach(index => {
          totalR += data[index];
          totalG += data[index + 1];
          totalB += data[index + 2];
        });

        const avgR = Math.round(totalR / validPixels.length);
        const avgG = Math.round(totalG / validPixels.length);
        const avgB = Math.round(totalB / validPixels.length);

        // Tính brightness (luminance)
        const brightness = (avgR * 0.299 + avgG * 0.587 + avgB * 0.114);

        // Thresholds giống Facebook
        const isLight = brightness > 200; // Ngưỡng cao cho trắng
        const isDark = brightness < 80;   // Ngưỡng thấp cho đen

        let backgroundColor = '#161616'; // default dark

        if (isLight) {
          backgroundColor = '#ffffff';
        } else if (isDark) {
          backgroundColor = '#161616';
        } else {
          // Trung gian thì dùng default dark
          backgroundColor = '#161616';
        }

        resolve({
          backgroundColor,
          isLight,
          isDark
        });

      } catch (error) {
        console.error('Background color detection error:', error);
        resolve({
          backgroundColor: '#161616',
          isLight: false,
          isDark: true
        });
      }
    };

    processImage();
  });
};

export const generateAdaptiveBackground = (dominantColor: DominantColor): string => {
  const { r, g, b } = dominantColor;

  // Tạo gradient giống Facebook Stories
  const centerColor = `rgba(${r}, ${g}, ${b}, 0.7)`;
  const midColor = `rgba(${Math.round(r * 0.6)}, ${Math.round(g * 0.6)}, ${Math.round(b * 0.6)}, 0.5)`;
  const outerColor = `rgba(0, 0, 0, 0.9)`;

  return `radial-gradient(ellipse at center, ${centerColor} 0%, ${midColor} 40%, ${outerColor} 100%)`;
};

export const getDefaultBackground = (): string => {
  return 'radial-gradient(ellipse at center, rgba(20, 20, 20, 0.7) 0%, rgba(10, 10, 10, 0.5) 40%, rgba(0, 0, 0, 0.9) 100%)';
};