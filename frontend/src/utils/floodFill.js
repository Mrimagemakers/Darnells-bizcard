// Improved flood fill algorithm with tolerance for shaded/gradient areas

export const floodFill = (imageData, x, y, fillColor, tolerance = 30) => {
  const data = imageData.data;
  const width = imageData.width;
  const height = imageData.height;
  
  // Get the color at the clicked position
  const targetPos = (y * width + x) * 4;
  const targetR = data[targetPos];
  const targetG = data[targetPos + 1];
  const targetB = data[targetPos + 2];
  const targetA = data[targetPos + 3];
  
  // Parse fill color
  const fillR = parseInt(fillColor.slice(1, 3), 16);
  const fillG = parseInt(fillColor.slice(3, 5), 16);
  const fillB = parseInt(fillColor.slice(5, 7), 16);
  
  // If the target color is very similar to fill color, do nothing
  const colorDistance = Math.sqrt(
    Math.pow(targetR - fillR, 2) +
    Math.pow(targetG - fillG, 2) +
    Math.pow(targetB - fillB, 2)
  );
  
  if (colorDistance < 10) {
    return imageData;
  }
  
  // Create a visited array to avoid revisiting pixels
  const visited = new Uint8Array(width * height);
  
  // Stack for flood fill
  const pixelStack = [[x, y]];
  
  const matchesTarget = (pos) => {
    const r = data[pos];
    const g = data[pos + 1];
    const b = data[pos + 2];
    const a = data[pos + 3];
    
    // Check if pixel is within tolerance of target color
    const distance = Math.sqrt(
      Math.pow(r - targetR, 2) +
      Math.pow(g - targetG, 2) +
      Math.pow(b - targetB, 2)
    );
    
    return distance <= tolerance && a > 0;
  };
  
  const colorPixel = (pos) => {
    data[pos] = fillR;
    data[pos + 1] = fillG;
    data[pos + 2] = fillB;
    data[pos + 3] = 255; // Full opacity
  };
  
  while (pixelStack.length > 0) {
    const [px, py] = pixelStack.pop();
    
    if (px < 0 || px >= width || py < 0 || py >= height) {
      continue;
    }
    
    const pixelIndex = py * width + px;
    if (visited[pixelIndex]) {
      continue;
    }
    
    const currentPos = pixelIndex * 4;
    
    if (matchesTarget(currentPos)) {
      visited[pixelIndex] = 1;
      colorPixel(currentPos);
      
      // Add neighboring pixels (4-way connectivity)
      pixelStack.push([px + 1, py]);
      pixelStack.push([px - 1, py]);
      pixelStack.push([px, py + 1]);
      pixelStack.push([px, py - 1]);
    }
  }
  
  return imageData;
};

export const getPixelColor = (imageData, x, y) => {
  const pos = (y * imageData.width + x) * 4;
  const r = imageData.data[pos];
  const g = imageData.data[pos + 1];
  const b = imageData.data[pos + 2];
  return `rgb(${r}, ${g}, ${b})`;
};
