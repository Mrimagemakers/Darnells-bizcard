import React from 'react';
import { useNavigate } from 'react-router-dom';
import { categories } from '../data/mock';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Palette, BookOpen, Heart, Share2 } from 'lucide-react';
import MusicPlayer from './MusicPlayer';

const HomePage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-pink-50 to-purple-50">
      <MusicPlayer />
      {/* Hero Section with Background */}
      <div 
        className="relative bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: 'url(/hero-background.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-transparent"></div>
        <div className="relative container mx-auto px-4 py-24">
          <div className="text-center mb-16">
            <h1 className="text-7xl font-bold mb-6 text-white drop-shadow-2xl">
              The Coloring Odyssey
            </h1>
            <p className="text-2xl text-white mb-10 drop-shadow-lg">
              Embark on a creative journey with endless coloring possibilities
            </p>
            <Button 
              size="lg" 
              onClick={() => navigate('/categories')}
              className="bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white px-10 py-7 text-xl transition-all duration-300 hover:scale-105 shadow-2xl"
            >
              <Palette className="mr-2 h-6 w-6" />
              Start Coloring
            </Button>
          </div>
        </div>
      </div>
      
      {/* Content Section */}
      <div className="container mx-auto px-4 py-16">

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          <Card className="border-2 border-orange-200 hover:border-orange-400 transition-all duration-300 hover:shadow-lg">
            <CardHeader>
              <BookOpen className="h-10 w-10 text-orange-500 mb-2" />
              <CardTitle>56 Pages</CardTitle>
              <CardDescription>Diverse coloring pages across 10 categories</CardDescription>
            </CardHeader>
          </Card>
          
          <Card className="border-2 border-pink-200 hover:border-pink-400 transition-all duration-300 hover:shadow-lg">
            <CardHeader>
              <Palette className="h-10 w-10 text-pink-500 mb-2" />
              <CardTitle>16 Colors</CardTitle>
              <CardDescription>Beautiful color palette for your creativity</CardDescription>
            </CardHeader>
          </Card>
          
          <Card className="border-2 border-purple-200 hover:border-purple-400 transition-all duration-300 hover:shadow-lg">
            <CardHeader>
              <Heart className="h-10 w-10 text-purple-500 mb-2" />
              <CardTitle>Save Gallery</CardTitle>
              <CardDescription>Keep your favorite artworks in your gallery</CardDescription>
            </CardHeader>
          </Card>
          
          <Card className="border-2 border-blue-200 hover:border-blue-400 transition-all duration-300 hover:shadow-lg">
            <CardHeader>
              <Share2 className="h-10 w-10 text-blue-500 mb-2" />
              <CardTitle>Share Art</CardTitle>
              <CardDescription>Download and share your masterpieces</CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Quick Category Preview */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold mb-8 text-gray-800">Explore Categories</h2>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {categories.map((category) => (
            <Card 
              key={category.id}
              className="cursor-pointer hover:scale-105 transition-all duration-300 hover:shadow-xl overflow-hidden border-2"
              style={{ borderColor: category.color }}
              onClick={() => navigate(`/category/${category.id}`)}
            >
              <CardContent className="p-0">
                <div className="aspect-square relative">
                  <img 
                    src={category.thumbnail} 
                    alt={category.name}
                    className="w-full h-full object-cover"
                  />
                  <div 
                    className="absolute bottom-0 left-0 right-0 p-3 text-white font-semibold text-center"
                    style={{ backgroundColor: `${category.color}E6` }}
                  >
                    {category.name}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mt-12">
          <Button 
            variant="outline" 
            size="lg"
            onClick={() => navigate('/gallery')}
            className="border-2 border-purple-300 hover:bg-purple-50 transition-all duration-300"
          >
            <Heart className="mr-2 h-5 w-5" />
            View My Gallery
          </Button>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
