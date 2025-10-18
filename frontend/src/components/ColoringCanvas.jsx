import React, { useRef, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { coloringPages, colorPalette, saveArtwork } from '../data/mock';
import { floodFill } from '../utils/floodFill';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { ArrowLeft, Download, Undo, Trash2, Heart } from 'lucide-react';
import { useToast } from '../hooks/use-toast';

const ColoringCanvas = () => {
  const navigate = useNavigate();
  const { pageId } = useParams();
  const { toast } = useToast();
  
  const canvasRef = useRef(null);
  const [selectedColor, setSelectedColor] = useState(colorPalette[0].hex);
  const [isLoading, setIsLoading] = useState(true);
  const [history, setHistory] = useState([]);
  const [currentStep, setCurrentStep] = useState(-1);
  
  const page = coloringPages.find(p => p.id === pageId);

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

  const handleCanvasClick = (e) => {
    if (isLoading) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const rect = canvas.getBoundingClientRect();
    
    // Calculate click position relative to canvas
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = Math.floor((e.clientX - rect.left) * scaleX);
    const y = Math.floor((e.clientY - rect.top) * scaleY);
    
    // Get current image data
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    
    // Apply flood fill
    const filledData = floodFill(imageData, x, y, selectedColor);
    ctx.putImageData(filledData, 0, 0);
    
    // Save to history
    const newHistory = history.slice(0, currentStep + 1);
    newHistory.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
    setHistory(newHistory);
    setCurrentStep(newHistory.length - 1);
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
              onClick={handleUndo}
              disabled={currentStep <= 0}
              className="border-orange-300 hover:bg-orange-50"
            >
              <Undo className="h-4 w-4" />
            </Button>
            <Button 
              variant="outline"
              size="sm"
              onClick={handleClear}
              disabled={currentStep <= 0}
              className="border-red-300 hover:bg-red-50"
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
                <div className="flex items-center justify-center p-4 relative">
                  {isLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white z-10">
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
                        <p className="text-gray-600">Loading canvas...</p>
                      </div>
                    </div>
                  )}
                  <canvas
                    ref={canvasRef}
                    onClick={handleCanvasClick}
                    className="cursor-crosshair border-2 border-gray-200 rounded-lg max-w-full h-auto"
                    style={{ maxHeight: '70vh', display: isLoading ? 'none' : 'block' }}
                  />
                </div>
              </CardContent>
            </Card>
            
            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3 mt-4">
              <Button 
                onClick={handleDownload}
                className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white"
              >
                <Download className="mr-2 h-5 w-5" />
                Download
              </Button>
              <Button 
                onClick={handleSaveToGallery}
                className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
              >
                <Heart className="mr-2 h-5 w-5" />
                Save to Gallery
              </Button>
            </div>
          </div>

          {/* Color Palette */}
          <div>
            <Card className="shadow-xl">
              <CardContent className="p-4">
                <h3 className="font-bold text-lg mb-4 text-gray-800">Color Palette</h3>
                <div className="grid grid-cols-4 gap-3">
                  {colorPalette.map((color) => (
                    <button
                      key={color.hex}
                      onClick={() => setSelectedColor(color.hex)}
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
                    <strong>Tip:</strong> Click on any area of the image to fill it with the selected color!
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
