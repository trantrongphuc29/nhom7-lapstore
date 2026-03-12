import React, { useState, useEffect } from 'react';
import { API_ENDPOINTS, BACKEND_BASE_URL } from '../config/api';

const Banner = () => {
  const [banners, setBanners] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [,setDirection] = useState('next');

  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.BANNERS);
      const data = await response.json();
      if (data.records && data.records.length > 0) {
        const bannersData = data.records.map(banner => ({
          ...banner,
          image_url: banner.image_url.startsWith('http') 
            ? banner.image_url 
            : `${BACKEND_BASE_URL}/${banner.image_url}`
        }));
        setBanners(bannersData);
      }
    } catch (error) {
      console.error('Error fetching banners:', error);
    }
  };

  const nextBanner = () => {
    setDirection('next');
    setCurrentIndex((prev) => (prev + 1) % banners.length);
  };

  const prevBanner = () => {
    setDirection('prev');
    setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length);
  };

  if (banners.length === 0) return null;

  return (
    <section className="mb-8">
      <div className="relative w-full h-64 md:h-80 rounded-xl overflow-hidden group">
        <div className="relative w-full h-full">
          {banners.map((banner, index) => (
            <img
              key={banner.id}
              src={banner.image_url}
              alt={banner.title || 'Banner'}
              className={`absolute inset-0 w-full h-full object-cover transition-all duration-500 ${
                index === currentIndex
                  ? 'opacity-100 translate-x-0'
                  : index < currentIndex
                  ? 'opacity-0 -translate-x-full'
                  : 'opacity-0 translate-x-full'
              }`}
            />
          ))}
        </div>
        <button
          onClick={prevBanner}
          className="absolute left-4 top-1/2 -translate-y-1/2 bg-white hover:bg-slate-100 text-slate-800 rounded-full p-3 transition-all z-10 shadow-lg"
          aria-label="Previous banner"
        >
          <span className="material-symbols-outlined text-2xl">chevron_left</span>
        </button>
        <button
          onClick={nextBanner}
          className="absolute right-4 top-1/2 -translate-y-1/2 bg-white hover:bg-slate-100 text-slate-800 rounded-full p-3 transition-all z-10 shadow-lg"
          aria-label="Next banner"
        >
          <span className="material-symbols-outlined text-2xl">chevron_right</span>
        </button>
        {banners.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
            {banners.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === currentIndex ? 'bg-white w-8' : 'bg-white/50'
                }`}
                aria-label={`Go to banner ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default Banner;
