import React, { useRef, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { coloringPages, colorPalette, saveArtwork } from '../data/mock';
import { floodFill } from '../utils/floodFill';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { ArrowLeft, Download, Undo, Trash2, Heart, Share2, ZoomIn, ZoomOut, Maximize2, Droplet, Pen, Highlighter, Pencil } from 'lucide-react';
import { useToast } from '../hooks/use-toast';
import MusicPlayer from './MusicPlayer';

const ColoringCanvas = () => {
  const navigate = useNavigate();
  const { pageId } = useParams();
  const { toast } = useToast();
  
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [selectedColor, setSelectedColor] = useState(colorPalette[0].hex);
  const [isLoading, setIsLoading] = useState(true);
  const [history, setHistory] = useState([]);
  const [currentStep, setCurrentStep] = useState(-1);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [lastTouchDistance, setLastTouchDistance] = useState(null);
  const [touchStartTime, setTouchStartTime] = useState(null);
  const [tool, setTool] = useState('bucket'); // 'bucket', 'pen', 'marker', 'pencil'
  const [brushSize, setBrushSize] = useState(5);
  const [fillTolerance, setFillTolerance] = useState(30);
  const [isDrawing, setIsDrawing] = useState(false);
  const [lastDrawPoint, setLastDrawPoint] = useState(null);
  const [drawingPoints, setDrawingPoints] = useState([]);
  const [recentColors, setRecentColors] = useState([]);
  const [showColorPicker, setShowColorPicker] = useState(false);
  
  const page = coloringPages.find(p => p.id === pageId);

  const handleColorSelect = (color) => {
    setSelectedColor(color);
    
    // Add to recent colors if not already there
    if (!recentColors.includes(color)) {
      setRecentColors(prev => {
        const updated = [color, ...prev];
        return updated.slice(0, 8); // Keep only last 8 colors
      });
    }
  };

  useEffect(() => {
    if (!page) {
      console.log('No page found');
      return;
    }
    
    const canvas = canvasRef.current;
    if (!canvas) {
      console.log('No canvas ref');
      return;
    }
    
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) {
      console.log('No canvas context');
      return;
    }
    
    console.log('Starting to load image:', page.image);
    const img = new Image();
    
    img.onload = () => {
      console.log('Image loaded successfully!', img.width, 'x', img.height);
      
      try {
        // Set canvas size
        const maxWidth = 800;
        const maxHeight = 600;
        let width = img.width;
        let height = img.height;
        
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        
        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        console.log('Drawing image on canvas:', width, 'x', height);
        ctx.drawImage(img, 0, 0, width, height);
        
        // Save initial state
        const initialState = ctx.getImageData(0, 0, canvas.width, canvas.height);
        setHistory([initialState]);
        setCurrentStep(0);
        setIsLoading(false);
        console.log('Canvas ready!');
      } catch (error) {
        console.error('Error drawing image:', error);
        setIsLoading(false);
      }
    };
    
    img.onerror = (error) => {
      console.error('Image load error:', error);
      console.error('Failed to load:', page.image);
      toast({
        title: 'Error loading image',
        description: `Failed to load the coloring page. Please try another one.`,
        variant: 'destructive'
      });
      setIsLoading(false);
    };
    
    // Set src after setting up handlers
    img.src = page.image;
    
  }, [page, toast]);

  const getCanvasPoint = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    
    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX || (e.touches && e.touches[0]?.clientX);
    const clientY = e.clientY || (e.touches && e.touches[0]?.clientY);
    
    if (clientX === undefined || clientY === undefined) return null;
    
    const scaleX = canvas.width / (rect.width / zoom);
    const scaleY = canvas.height / (rect.height / zoom);
    const x = Math.floor(((clientX - rect.left) / zoom - pan.x / zoom) * scaleX);
    const y = Math.floor(((clientY - rect.top) / zoom - pan.y / zoom) * scaleY);
    
    return { x, y };
  };

  const drawOnCanvas = (x, y) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.strokeStyle = selectedColor;
    ctx.fillStyle = selectedColor;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    // Enable anti-aliasing for smoother lines
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    
    // Set tool-specific properties
    switch (tool) {
      case 'pen':
        ctx.lineWidth = brushSize;
        ctx.globalAlpha = 1;
        break;
      case 'marker':
        ctx.lineWidth = brushSize * 1.5;
        ctx.globalAlpha = 0.6;
        break;
      case 'pencil':
        ctx.lineWidth = brushSize * 0.8;
        ctx.globalAlpha = 0.8;
        break;
      default:
        return;
    }
    
    if (lastDrawPoint) {
      // Smooth drawing using quadratic curves for better interpolation
      const points = drawingPoints;
      
      if (points.length >= 2) {
        // Use quadratic curve for smoother lines
        const p0 = points[points.length - 2];
        const p1 = points[points.length - 1];
        const midPoint = {
          x: (p0.x + p1.x) / 2,
          y: (p0.y + p1.y) / 2
        };
        
        ctx.beginPath();
        ctx.moveTo(p0.x, p0.y);
        ctx.quadraticCurveTo(p1.x, p1.y, midPoint.x, midPoint.y);
        ctx.stroke();
      } else {
        // Fallback to line for first segment
        ctx.beginPath();
        ctx.moveTo(lastDrawPoint.x, lastDrawPoint.y);
        ctx.lineTo(x, y);
        ctx.stroke();
      }
      
      // Interpolate points for very smooth drawing
      const distance = Math.sqrt(
        Math.pow(x - lastDrawPoint.x, 2) + 
        Math.pow(y - lastDrawPoint.y, 2)
      );
      
      // Add intermediate points for ultra-smooth lines
      if (distance > 2) {
        const steps = Math.ceil(distance / 2);
        for (let i = 1; i <= steps; i++) {
          const t = i / steps;
          const ix = lastDrawPoint.x + (x - lastDrawPoint.x) * t;
          const iy = lastDrawPoint.y + (y - lastDrawPoint.y) * t;
          
          ctx.beginPath();
          ctx.arc(ix, iy, brushSize / 2, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    } else {
      // Draw a dot for single click
      ctx.beginPath();
      ctx.arc(x, y, brushSize / 2, 0, Math.PI * 2);
      ctx.fill();
    }
    
    ctx.globalAlpha = 1;
  };

  const handleCanvasClick = (e) => {
    if (isLoading || isPanning || tool !== 'bucket') return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const point = getCanvasPoint(e);
    if (!point) return;
    
    const { x, y } = point;
    
    // Boundary check
    if (x < 0 || x >= canvas.width || y < 0 || y >= canvas.height) return;
    
    // Get current image data
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    
    // Apply flood fill with tolerance
    const filledData = floodFill(imageData, x, y, selectedColor, fillTolerance);
    ctx.putImageData(filledData, 0, 0);
    
    // Save to history
    const newHistory = history.slice(0, currentStep + 1);
    newHistory.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
    setHistory(newHistory);
    setCurrentStep(newHistory.length - 1);
  };

  const handleCanvasMouseDown = (e) => {
    if (isLoading || isPanning || tool === 'bucket') return;
    
    const point = getCanvasPoint(e);
    if (!point) return;
    
    setIsDrawing(true);
    setLastDrawPoint(point);
    setDrawingPoints([point]);
    drawOnCanvas(point.x, point.y);
  };

  const handleCanvasMouseMove = (e) => {
    if (!isDrawing || tool === 'bucket') return;
    
    const point = getCanvasPoint(e);
    if (!point) return;
    
    // Throttle points to improve performance and smoothness
    if (lastDrawPoint) {
      const distance = Math.sqrt(
        Math.pow(point.x - lastDrawPoint.x, 2) + 
        Math.pow(point.y - lastDrawPoint.y, 2)
      );
      
      // Only draw if moved enough pixels (reduces jitter)
      if (distance < 1) return;
    }
    
    setDrawingPoints(prev => [...prev, point]);
    drawOnCanvas(point.x, point.y);
    setLastDrawPoint(point);
  };

  const handleCanvasMouseUp = () => {
    if (isDrawing && tool !== 'bucket') {
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          // Save to history
          const newHistory = history.slice(0, currentStep + 1);
          newHistory.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
          setHistory(newHistory);
          setCurrentStep(newHistory.length - 1);
        }
      }
    }
    setIsDrawing(false);
    setLastDrawPoint(null);
    setDrawingPoints([]);
  };

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = () => {
    setZoom(prev => {
      const newZoom = Math.max(prev - 0.25, 0.5);
      if (newZoom === 1) {
        setPan({ x: 0, y: 0 });
      }
      return newZoom;
    });
  };

  const handleZoomReset = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const handleMouseDown = (e) => {
    if (zoom > 1) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e) => {
    if (isPanning && zoom > 1) {
      setPan({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  const handleWheel = (e) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      handleZoomIn();
    } else {
      handleZoomOut();
    }
  };

  // Touch event handlers for mobile
  const getTouchDistance = (touches) => {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const getTouchCenter = (touches) => {
    return {
      x: (touches[0].clientX + touches[1].clientX) / 2,
      y: (touches[0].clientY + touches[1].clientY) / 2
    };
  };

  const handleTouchStart = (e) => {
    setTouchStartTime(Date.now());
    
    if (e.touches.length === 2) {
      // Two fingers - pinch to zoom
      e.preventDefault();
      const distance = getTouchDistance(e.touches);
      setLastTouchDistance(distance);
      setIsPanning(false);
    } else if (e.touches.length === 1 && zoom > 1) {
      // One finger when zoomed - pan
      setIsPanning(true);
      setPanStart({ 
        x: e.touches[0].clientX - pan.x, 
        y: e.touches[0].clientY - pan.y 
      });
    }
  };

  const handleTouchMove = (e) => {
    if (e.touches.length === 2 && lastTouchDistance) {
      // Pinch zoom
      e.preventDefault();
      const distance = getTouchDistance(e.touches);
      const scale = distance / lastTouchDistance;
      
      setZoom(prev => {
        const newZoom = Math.max(0.5, Math.min(3, prev * scale));
        return newZoom;
      });
      
      setLastTouchDistance(distance);
    } else if (e.touches.length === 1 && isPanning && zoom > 1) {
      // Pan with one finger
      e.preventDefault();
      setPan({
        x: e.touches[0].clientX - panStart.x,
        y: e.touches[0].clientY - panStart.y
      });
    }
  };

  const handleTouchEnd = (e) => {
    const touchDuration = Date.now() - touchStartTime;
    
    if (e.touches.length === 0) {
      setLastTouchDistance(null);
      
      // If it was a quick tap (not a drag), treat it as a color fill
      if (touchDuration < 300 && !isPanning && zoom === 1) {
        // Let the click event handle it
      }
      
      setIsPanning(false);
    } else if (e.touches.length === 1) {
      // Transition from two fingers to one
      setLastTouchDistance(null);
      if (zoom > 1) {
        setIsPanning(true);
        setPanStart({ 
          x: e.touches[0].clientX - pan.x, 
          y: e.touches[0].clientY - pan.y 
        });
      }
    }
  };

  const handleUndo = () => {
    if (currentStep > 0) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      const prevStep = currentStep - 1;
      ctx.putImageData(history[prevStep], 0, 0);
      setCurrentStep(prevStep);
    }
  };

  const handleClear = () => {
    if (currentStep > 0) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      ctx.putImageData(history[0], 0, 0);
      setCurrentStep(0);
      
      toast({
        title: 'Canvas cleared',
        description: 'Your artwork has been reset'
      });
    }
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      toast({
        title: 'Error',
        description: 'Canvas not ready. Please try again.',
        variant: 'destructive'
      });
      return;
    }
    
    try {
      const link = document.createElement('a');
      link.download = `coloring-odyssey-${pageId}-${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: 'Downloaded!',
        description: 'Your artwork has been saved to your device'
      });
    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: 'Download failed',
        description: 'Unable to download the image. Please try again.',
        variant: 'destructive'
      });
    }
  };

  const handleShare = async () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      toast({
        title: 'Error',
        description: 'Canvas not ready. Please try again.',
        variant: 'destructive'
      });
      return;
    }
    
    try {
      // Convert canvas to blob
      canvas.toBlob(async (blob) => {
        if (!blob) {
          toast({
            title: 'Error',
            description: 'Unable to create image for sharing',
            variant: 'destructive'
          });
          return;
        }
        
        const file = new File([blob], `coloring-odyssey-${pageId}.png`, { type: 'image/png' });
        
        // Check if Web Share API is available
        if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({
              files: [file],
              title: 'My Coloring Odyssey Artwork',
              text: `Check out my colored artwork: ${page.name}`
            });
            
            toast({
              title: 'Shared!',
              description: 'Your artwork has been shared'
            });
          } catch (shareError) {
            if (shareError.name !== 'AbortError') {
              console.error('Share error:', shareError);
              // Fallback to download
              handleDownload();
            }
          }
        } else {
          // Fallback: Download the image
          toast({
            title: 'Share not supported',
            description: 'Downloaded image instead. You can share it manually.',
            variant: 'default'
          });
          handleDownload();
        }
      }, 'image/png');
    } catch (error) {
      console.error('Share error:', error);
      toast({
        title: 'Share failed',
        description: 'Unable to share. Try downloading instead.',
        variant: 'destructive'
      });
    }
  };

  const handleSaveToGallery = () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      toast({
        title: 'Error',
        description: 'Canvas not ready. Please try again.',
        variant: 'destructive'
      });
      return;
    }
    
    try {
      const dataUrl = canvas.toDataURL('image/png');
      
      saveArtwork({
        pageId,
        pageName: page.name,
        imageData: dataUrl
      });
      
      toast({
        title: 'Saved to Gallery!',
        description: 'View it in your gallery anytime'
      });
    } catch (error) {
      console.error('Save error:', error);
      toast({
        title: 'Save failed',
        description: 'Unable to save to gallery. Please try again.',
        variant: 'destructive'
      });
    }
  };

  if (!page) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Page not found</h2>
          <Button onClick={() => navigate('/categories')}>Back to Categories</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-pink-50 to-purple-50">
      <MusicPlayer />
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Button 
            variant="ghost" 
            onClick={() => navigate(-1)}
            className="hover:bg-white/50"
          >
            <ArrowLeft className="mr-2 h-5 w-5" />
            Back
          </Button>
          
          <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-500 to-pink-500 bg-clip-text text-transparent">
            {page.name}
          </h1>
          
          <div className="flex gap-2">
            <Button 
              variant="outline"
              size="sm"
              onClick={handleZoomOut}
              disabled={zoom <= 0.5}
              className="border-blue-300 hover:bg-blue-50"
              title="Zoom Out"
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Button 
              variant="outline"
              size="sm"
              onClick={handleZoomReset}
              disabled={zoom === 1}
              className="border-blue-300 hover:bg-blue-50"
              title="Reset Zoom"
            >
              <Maximize2 className="h-4 w-4" />
            </Button>
            <Button 
              variant="outline"
              size="sm"
              onClick={handleZoomIn}
              disabled={zoom >= 3}
              className="border-blue-300 hover:bg-blue-50"
              title="Zoom In"
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button 
              variant="outline"
              size="sm"
              onClick={handleUndo}
              disabled={currentStep <= 0}
              className="border-orange-300 hover:bg-orange-50"
              title="Undo"
            >
              <Undo className="h-4 w-4" />
            </Button>
            <Button 
              variant="outline"
              size="sm"
              onClick={handleClear}
              disabled={currentStep <= 0}
              className="border-red-300 hover:bg-red-50"
              title="Clear"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Canvas */}
          <div className="lg:col-span-3">
            <Card className="overflow-hidden shadow-2xl">
              <CardContent className="p-0 bg-white">
                <div 
                  ref={containerRef}
                  className="flex items-center justify-center p-4 relative overflow-hidden"
                  style={{ 
                    minHeight: '70vh', 
                    cursor: isPanning ? 'grabbing' : (zoom > 1 ? 'grab' : 'auto'),
                    touchAction: zoom > 1 ? 'none' : 'auto'
                  }}
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                  onWheel={handleWheel}
                  onTouchStart={handleTouchStart}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}
                >
                  {isLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white z-10">
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
                        <p className="text-gray-600">Loading canvas...</p>
                      </div>
                    </div>
                  )}
                  <div
                    style={{
                      transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
                      transformOrigin: 'center center',
                      transition: isPanning ? 'none' : 'transform 0.1s ease-out'
                    }}
                  >
                    <canvas
                      ref={canvasRef}
                      onClick={handleCanvasClick}
                      onMouseDown={handleCanvasMouseDown}
                      onMouseMove={handleCanvasMouseMove}
                      onMouseUp={handleCanvasMouseUp}
                      onMouseLeave={handleCanvasMouseUp}
                      onTouchStart={handleCanvasMouseDown}
                      onTouchMove={handleCanvasMouseMove}
                      onTouchEnd={handleCanvasMouseUp}
                      className="border-2 border-gray-200 rounded-lg"
                      style={{ 
                        display: isLoading ? 'none' : 'block',
                        cursor: isPanning ? 'grabbing' : (zoom > 1 ? 'grab' : (tool === 'bucket' ? 'crosshair' : 'crosshair')),
                        maxWidth: '100%',
                        height: 'auto'
                      }}
                    />
                  </div>
                  
                  {/* Zoom level indicator */}
                  {zoom !== 1 && (
                    <div className="absolute top-4 left-4 bg-black/70 text-white px-3 py-1 rounded-full text-sm font-semibold">
                      {Math.round(zoom * 100)}%
                    </div>
                  )}
                  
                  {/* Pan instruction */}
                  {zoom > 1 && !isPanning && (
                    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/70 text-white px-4 py-2 rounded-full text-sm text-center">
                      <span className="hidden sm:inline">Click and drag to pan • Scroll to zoom</span>
                      <span className="sm:hidden">Drag to pan • Pinch to zoom</span>
                    </div>
                  )}
                  
                  {/* Pinch instruction for mobile */}
                  {zoom === 1 && (
                    <div className="absolute bottom-4 right-4 bg-black/70 text-white px-3 py-2 rounded-full text-xs sm:hidden">
                      👆 Pinch to zoom
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            
            {/* Action Buttons */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
              <Button 
                onClick={handleDownload}
                disabled={isLoading}
                className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white"
              >
                <Download className="mr-2 h-5 w-5" />
                Download
              </Button>
              <Button 
                onClick={handleShare}
                disabled={isLoading}
                className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white"
              >
                <Share2 className="mr-2 h-5 w-5" />
                Share
              </Button>
              <Button 
                onClick={handleSaveToGallery}
                disabled={isLoading}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
              >
                <Heart className="mr-2 h-5 w-5" />
                Save to Gallery
              </Button>
            </div>
          </div>

          {/* Tools & Color Palette */}
          <div>
            {/* Tool Selection */}
            <Card className="shadow-xl mb-4">
              <CardContent className="p-4">
                <h3 className="font-bold text-lg mb-4 text-gray-800">Tools</h3>
                <div className="grid grid-cols-4 gap-2">
                  <button
                    onClick={() => setTool('bucket')}
                    className={`p-3 rounded-lg border-2 transition-all duration-200 hover:scale-105 ${
                      tool === 'bucket'
                        ? 'border-orange-500 bg-orange-50 text-orange-600'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                    title="Bucket Fill"
                  >
                    <Droplet className="h-6 w-6 mx-auto" />
                    <p className="text-xs mt-1">Fill</p>
                  </button>
                  <button
                    onClick={() => setTool('pen')}
                    className={`p-3 rounded-lg border-2 transition-all duration-200 hover:scale-105 ${
                      tool === 'pen'
                        ? 'border-blue-500 bg-blue-50 text-blue-600'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                    title="Pen"
                  >
                    <Pen className="h-6 w-6 mx-auto" />
                    <p className="text-xs mt-1">Pen</p>
                  </button>
                  <button
                    onClick={() => setTool('marker')}
                    className={`p-3 rounded-lg border-2 transition-all duration-200 hover:scale-105 ${
                      tool === 'marker'
                        ? 'border-purple-500 bg-purple-50 text-purple-600'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                    title="Marker"
                  >
                    <Highlighter className="h-6 w-6 mx-auto" />
                    <p className="text-xs mt-1">Marker</p>
                  </button>
                  <button
                    onClick={() => setTool('pencil')}
                    className={`p-3 rounded-lg border-2 transition-all duration-200 hover:scale-105 ${
                      tool === 'pencil'
                        ? 'border-green-500 bg-green-50 text-green-600'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                    title="Pencil"
                  >
                    <Pencil className="h-6 w-6 mx-auto" />
                    <p className="text-xs mt-1">Pencil</p>
                  </button>
                </div>
                
                {/* Fill Tolerance Slider */}
                {tool === 'bucket' && (
                  <div className="mt-4 p-3 bg-orange-50 rounded-lg border border-orange-200">
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-semibold text-gray-700">Fill Tolerance</label>
                      <span className="text-sm font-bold text-orange-600">{fillTolerance}</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={fillTolerance}
                      onChange={(e) => setFillTolerance(Number(e.target.value))}
                      className="w-full h-2 bg-orange-200 rounded-lg appearance-none cursor-pointer accent-orange-500"
                    />
                    <div className="flex justify-between text-xs text-gray-600 mt-1">
                      <span>Exact</span>
                      <span>Flexible</span>
                    </div>
                    <p className="text-xs text-gray-600 mt-2">
                      Higher values fill similar shaded areas
                    </p>
                  </div>
                )}
                
                {/* Brush Size Slider */}
                {tool !== 'bucket' && (
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-semibold text-gray-700">Brush Size</label>
                      <span className="text-sm font-bold text-gray-900">{brushSize}px</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="30"
                      value={brushSize}
                      onChange={(e) => setBrushSize(Number(e.target.value))}
                      className="w-full h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer accent-orange-500"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>Fine</span>
                      <span>Bold</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Color Palette */}
            <Card className="shadow-xl">
              <CardContent className="p-4">
                <h3 className="font-bold text-lg mb-4 text-gray-800">Colors</h3>
                
                {/* Custom Color Picker */}
                <div className="mb-4 p-3 bg-gradient-to-r from-pink-50 to-purple-50 rounded-lg border-2 border-purple-200">
                  <label className="text-sm font-semibold text-gray-700 mb-2 block">Custom Color</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={selectedColor}
                      onChange={(e) => handleColorSelect(e.target.value)}
                      className="w-full h-12 rounded-lg cursor-pointer border-2 border-gray-300"
                    />
                    <div 
                      className="w-12 h-12 rounded-lg border-2 border-gray-300 flex-shrink-0"
                      style={{ backgroundColor: selectedColor }}
                      title="Current Color"
                    />
                  </div>
                  <p className="text-xs text-gray-600 mt-2">Click to pick any color</p>
                </div>
                
                {/* Recent Colors */}
                {recentColors.length > 0 && (
                  <div className="mb-4">
                    <label className="text-sm font-semibold text-gray-700 mb-2 block">Recent Colors</label>
                    <div className="grid grid-cols-8 gap-2">
                      {recentColors.map((color, index) => (
                        <button
                          key={`recent-${index}`}
                          onClick={() => handleColorSelect(color)}
                          className={`w-full aspect-square rounded-lg transition-all duration-200 hover:scale-110 border-2 ${
                            selectedColor === color 
                              ? 'ring-4 ring-orange-500 ring-offset-1 scale-110 border-orange-500' 
                              : 'border-gray-200 hover:border-gray-400'
                          }`}
                          style={{ backgroundColor: color }}
                          title="Recent Color"
                        />
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Preset Color Palette */}
                <label className="text-sm font-semibold text-gray-700 mb-2 block">Preset Colors</label>
                <div className="grid grid-cols-6 gap-2 max-h-80 overflow-y-auto pr-2">
                  {colorPalette.map((color) => (
                    <button
                      key={color.hex}
                      onClick={() => handleColorSelect(color.hex)}
                      className={`w-full aspect-square rounded-lg transition-all duration-200 hover:scale-110 ${
                        selectedColor === color.hex 
                          ? 'ring-4 ring-orange-500 ring-offset-2 scale-110' 
                          : 'hover:ring-2 hover:ring-gray-300'
                      }`}
                      style={{ backgroundColor: color.hex }}
                      title={color.name}
                    />
                  ))}
                </div>
                
                <div className="mt-6 p-3 bg-gray-100 rounded-lg">
                  <p className="text-sm text-gray-600 mb-2">Selected Color:</p>
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-12 h-12 rounded-lg border-2 border-gray-300"
                      style={{ backgroundColor: selectedColor }}
                    />
                    <div>
                      <p className="font-semibold">
                        {colorPalette.find(c => c.hex === selectedColor)?.name}
                      </p>
                      <p className="text-xs text-gray-500">{selectedColor}</p>
                    </div>
                  </div>
                </div>
                
                <div className="mt-6 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-800">
                    <strong>Tip:</strong> {
                      tool === 'bucket' 
                        ? 'Click on any area to fill it with color!' 
                        : 'Draw on the image with your selected tool!'
                    }
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ColoringCanvas;
