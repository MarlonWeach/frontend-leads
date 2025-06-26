'use client';

import { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Play, Pause, Volume2, VolumeX } from 'lucide-react';

export default function AdCreativeModal({ ad, isOpen, onClose }) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showFullText, setShowFullText] = useState(false);

  // Mapear dados reais da API para o formato esperado pelo componente
  const creativeData = {
    type: ad?.creative?.type || 'TEXT',
    images: ad?.creative?.images || [],
    video: ad?.creative?.video || null,
    text: ad?.creative?.text || ad?.creative?.body || ad?.creative?.description || 'Texto do anúncio não disponível',
    slideshow: ad?.creative?.slideshow || null,
    title: ad?.creative?.title || ad?.name || 'Título do anúncio',
    description: ad?.creative?.description || ad?.creative?.body || 'Descrição do anúncio',
    linkUrl: ad?.creative?.link_url || null,
    linkTitle: ad?.creative?.link_title || null,
    linkDescription: ad?.creative?.link_description || null,
    linkImageUrl: ad?.creative?.link_image_url || null
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

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  const nextImage = () => {
    if (creativeData.images && creativeData.images.length > 0) {
      setCurrentImageIndex((prev) => 
        prev === creativeData.images.length - 1 ? 0 : prev + 1
      );
    }
  };

  const prevImage = () => {
    if (creativeData.images && creativeData.images.length > 0) {
      setCurrentImageIndex((prev) => 
        prev === 0 ? creativeData.images.length - 1 : prev - 1
      );
    }
  };

  const renderImageContent = () => {
    if (!creativeData.images || creativeData.images.length === 0) {
      return (
        <div className="flex items-center justify-center h-64 bg-gray-800 rounded-lg">
          <p className="text-gray-400">Nenhuma imagem disponível</p>
        </div>
      );
    }

    const currentImage = creativeData.images[currentImageIndex];

    return (
      <div className="relative">
        <img
          src={currentImage.url}
          alt={currentImage.alt || 'Imagem do anúncio'}
          className="max-w-full max-h-96 object-contain rounded-lg"
          onError={(e) => {
            e.target.src = '/placeholder-image.png';
          }}
        />
        
        {creativeData.images.length > 1 && (
          <>
            <button
              onClick={prevImage}
              className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={nextImage}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 bg-black/50 text-white px-2 py-1 rounded text-sm">
              {currentImageIndex + 1} / {creativeData.images.length}
            </div>
          </>
        )}
      </div>
    );
  };

  const renderVideoContent = () => {
    if (!creativeData.video) {
      return (
        <div className="flex items-center justify-center h-64 bg-gray-800 rounded-lg">
          <p className="text-gray-400">Nenhum vídeo disponível</p>
        </div>
      );
    }

    return (
      <div className="relative">
        <video
          src={creativeData.video.url}
          poster={creativeData.video.thumbnail_url}
          className="max-w-full max-h-96 rounded-lg"
          controls
          autoPlay={false}
          muted={isMuted}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
        />
        <div className="absolute top-2 right-2 flex gap-2">
          <button
            onClick={() => setIsMuted(!isMuted)}
            className="bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors"
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
        </div>
      </div>
    );
  };

  const renderSlideshowContent = () => {
    if (!creativeData.slideshow || !creativeData.slideshow.images || creativeData.slideshow.images.length === 0) {
      return (
        <div className="flex items-center justify-center h-64 bg-gray-800 rounded-lg">
          <p className="text-gray-400">Nenhum slideshow disponível</p>
        </div>
      );
    }

    const currentImage = creativeData.slideshow.images[currentImageIndex];

    return (
      <div className="relative">
        <img
          src={currentImage.url}
          alt={currentImage.alt || 'Slideshow'}
          className="max-w-full max-h-96 object-contain rounded-lg"
          onError={(e) => {
            e.target.src = '/placeholder-image.png';
          }}
        />
        
        {creativeData.slideshow.images.length > 1 && (
          <>
            <button
              onClick={prevImage}
              className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={nextImage}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 bg-black/50 text-white px-2 py-1 rounded text-sm">
              {currentImageIndex + 1} / {creativeData.slideshow.images.length}
            </div>
          </>
        )}
      </div>
    );
  };

  const renderTextContent = () => {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">{creativeData.title}</h3>
          <div className="text-gray-300 leading-relaxed">
            {showFullText ? (
              <div>
                <p className="mb-4">{creativeData.text}</p>
                <button
                  onClick={() => setShowFullText(false)}
                  className="text-blue-400 hover:text-blue-300 text-sm"
                >
                  Ver menos
                </button>
              </div>
            ) : (
              <div>
                <p className="mb-4">
                  {creativeData.text.length > 200 
                    ? creativeData.text.substring(0, 200) + '...'
                    : creativeData.text
                  }
                </p>
                {creativeData.text.length > 200 && (
                  <button
                    onClick={() => setShowFullText(true)}
                    className="text-blue-400 hover:text-blue-300 text-sm"
                  >
                    Ver mais
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderContent = () => {
    switch (creativeData.type) {
      case 'IMAGE':
        return renderImageContent();
      case 'VIDEO':
        return renderVideoContent();
      case 'SLIDESHOW':
        return renderSlideshowContent();
      case 'TEXT':
      default:
        return renderTextContent();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-gray-900 rounded-xl p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-white">{ad?.name || 'Criativo do Anúncio'}</h2>
            <p className="text-gray-400 text-sm">
              {creativeData.type === 'IMAGE' && 'Imagem'}
              {creativeData.type === 'VIDEO' && 'Vídeo'}
              {creativeData.type === 'SLIDESHOW' && 'Slideshow'}
              {creativeData.type === 'TEXT' && 'Texto'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-2 rounded-full hover:bg-gray-800 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex justify-center">
          {renderContent()}
        </div>

        {/* Footer */}
        <div className="mt-6 pt-6 border-t border-gray-700">
          <div className="flex justify-between items-center text-sm text-gray-400">
            <div>
              <p><strong>AdSet:</strong> {ad?.adset_name || 'N/A'}</p>
              <p><strong>Campanha:</strong> {ad?.campaign_name || 'N/A'}</p>
            </div>
            <div className="text-right">
              <p><strong>Status:</strong> {ad?.status || 'N/A'}</p>
              <p><strong>ID:</strong> {ad?.id || 'N/A'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 