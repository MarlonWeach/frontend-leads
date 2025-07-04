'use client';

import { useState } from 'react';
import { Image, Video, FileText, Play, ChevronRight, ChevronLeft } from 'lucide-react';

export default function AdCreativePreview({ ad, onExpand }) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showFullText, setShowFullText] = useState(false);

  // Mapear dados reais da API para o formato esperado pelo componente
  const creativeData = {
    type: ad.creative?.type || 'TEXT',
    images: ad.creative?.images || [],
    video: ad.creative?.video || null,
    text: ad.creative?.text || ad.creative?.body || ad.creative?.description || 'Texto do anúncio não disponível',
    slideshow: ad.creative?.slideshow || null,
    title: ad.creative?.title || ad.name || 'Anúncio',
    description: ad.creative?.description || ad.creative?.body || '',
    linkUrl: ad.creative?.link_url || null,
    linkTitle: ad.creative?.link_title || null,
    linkDescription: ad.creative?.link_description || null,
    linkImageUrl: ad.creative?.link_image_url || null
  };

  // Se não há dados de criativo específicos, tentar usar dados do link
  if (!creativeData.images.length && creativeData.linkImageUrl) {
    creativeData.images = [{
      url: creativeData.linkImageUrl,
      alt: creativeData.linkTitle || creativeData.title,
      title: creativeData.linkTitle,
      description: creativeData.linkDescription
    }];
    creativeData.type = 'IMAGE';
  }

  // Se ainda não há imagens mas há texto, usar tipo TEXT
  if (!creativeData.images.length && creativeData.text && creativeData.text !== 'Texto do anúncio não disponível') {
    creativeData.type = 'TEXT';
  }

  const getCreativeTypeIcon = (type) => {
    switch (type) {
      case 'IMAGE':
        return <Image className="w-4 h-4 text-blue-400" />;
      case 'VIDEO':
        return <Video className="w-4 h-4 text-red-400" />;
      case 'SLIDESHOW':
        return <div className="flex gap-0.5">
          <Image className="w-3 h-3 text-blue-400" />
          <Image className="w-3 h-3 text-blue-400" />
          <Image className="w-3 h-3 text-blue-400" />
        </div>;
      default:
        return <FileText className="w-4 h-4 text-gray-400" />;
    }
  };

  const renderImagePreview = () => {
    if (creativeData.images && creativeData.images.length > 0) {
      const image = creativeData.images[currentImageIndex];
      return (
        <div className="relative group cursor-pointer" onClick={onExpand}>
          <img
            src={image.url}
            alt={image.alt || 'Preview do anúncio'}
            className="w-12 h-12 object-cover rounded-lg border border-white/10"
            onError={(e) => {
              e.target.src = '/placeholder-image.png';
            }}
          />
          {creativeData.images.length > 1 && (
            <div className="absolute -bottom-1 -right-1 bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {creativeData.images.length}
            </div>
          )}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 rounded-lg transition-colors flex items-center justify-center">
            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
              <ChevronRight className="w-4 h-4 text-white" />
            </div>
          </div>
        </div>
      );
    }
    return (
      <div className="w-12 h-12 bg-gray-800 rounded-lg border border-white/10 flex items-center justify-center">
        {getCreativeTypeIcon(creativeData.type)}
      </div>
    );
  };

  const renderVideoPreview = () => {
    if (creativeData.video) {
      return (
        <div className="relative group cursor-pointer" onClick={onExpand}>
          <img
            src={creativeData.video.thumbnail_url}
            alt="Video thumbnail"
            className="w-12 h-12 object-cover rounded-lg border border-white/10"
            onError={(e) => {
              e.target.src = '/placeholder-video.png';
            }}
          />
          <div className="absolute inset-0 bg-black/40 rounded-lg flex items-center justify-center">
            <Play className="w-4 h-4 text-white fill-white" />
          </div>
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 rounded-lg transition-colors flex items-center justify-center">
            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
              <ChevronRight className="w-4 h-4 text-white" />
            </div>
          </div>
        </div>
      );
    }
    return (
      <div className="w-12 h-12 bg-gray-800 rounded-lg border border-white/10 flex items-center justify-center">
        <Video className="w-4 h-4 text-red-400" />
      </div>
    );
  };

  const renderSlideshowPreview = () => {
    if (creativeData.slideshow && creativeData.slideshow.images && creativeData.slideshow.images.length > 0) {
      const image = creativeData.slideshow.images[currentImageIndex];
      return (
        <div className="relative group cursor-pointer" onClick={onExpand}>
          <img
            src={image.url}
            alt={image.alt || 'Slideshow preview'}
            className="w-12 h-12 object-cover rounded-lg border border-white/10"
            onError={(e) => {
              e.target.src = '/placeholder-image.png';
            }}
          />
          <div className="absolute -bottom-1 -right-1 bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {creativeData.slideshow.images.length}
          </div>
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 rounded-lg transition-colors flex items-center justify-center">
            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
              <ChevronRight className="w-4 h-4 text-white" />
            </div>
          </div>
        </div>
      );
    }
    return (
      <div className="w-12 h-12 bg-gray-800 rounded-lg border border-white/10 flex items-center justify-center">
        <div className="flex gap-0.5">
          <Image className="w-3 h-3 text-blue-400" />
          <Image className="w-3 h-3 text-blue-400" />
          <Image className="w-3 h-3 text-blue-400" />
        </div>
      </div>
    );
  };

  const renderTextPreview = () => {
    const maxLength = 50;
    const truncatedText = creativeData.text.length > maxLength 
      ? creativeData.text.substring(0, maxLength) + '...'
      : creativeData.text;

    return (
      <div className="w-12 h-12 bg-gray-800 rounded-lg border border-white/10 flex items-center justify-center group cursor-pointer" onClick={onExpand}>
        <div className="text-center">
          <FileText className="w-4 h-4 text-gray-400 mx-auto mb-1" />
          <div className="text-xs text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
            {truncatedText}
          </div>
        </div>
      </div>
    );
  };

  const renderPreview = () => {
    switch (creativeData.type) {
      case 'IMAGE':
        return renderImagePreview();
      case 'VIDEO':
        return renderVideoPreview();
      case 'SLIDESHOW':
        return renderSlideshowPreview();
      case 'TEXT':
      default:
        return renderTextPreview();
    }
  };

  return (
    <div className="flex items-center justify-center">
      {renderPreview()}
    </div>
  );
} 