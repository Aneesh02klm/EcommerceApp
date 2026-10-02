"use client";

import React, { useState, useRef, useEffect } from 'react';
import ReactCrop, { centerCrop, makeAspectCrop, Crop, PixelCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import imageCompression from 'browser-image-compression';
import { UploadCloud, X, Crop as CropIcon } from 'lucide-react';

interface SmartImageUploadProps {
  initialUrl?: string;
  onFileSelect: (file: File | null) => void;
  aspectRatio?: number; // e.g. 1 for 1:1, 16/9 for banners
  label?: string;
}

export function SmartImageUpload({ initialUrl, onFileSelect, aspectRatio = 1, label = "Upload Image" }: SmartImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(initialUrl || null);
  const [rawFile, setRawFile] = useState<File | null>(null);
  
  // Cropping states
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [imgSrc, setImgSrc] = useState('');
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (initialUrl && !initialUrl.startsWith('blob:')) {
      setPreview(initialUrl);
    }
  }, [initialUrl]);

  const onSelectFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      
      // Compress immediately for processing
      const options = { maxSizeMB: 0.5, maxWidthOrHeight: 1200, useWebWorker: true };
      try {
        const compressed = await imageCompression(file, options);
        
        const reader = new FileReader();
        reader.addEventListener('load', () => {
          const src = reader.result?.toString() || '';
          
          // Check image dimensions/ratio
          const img = new Image();
          img.src = src;
          img.onload = () => {
            const actualRatio = img.width / img.height;
            const targetRatio = aspectRatio;
            const tolerance = 0.05;
            
            if (Math.abs(actualRatio - targetRatio) <= tolerance) {
               // Matches!
               const objUrl = URL.createObjectURL(compressed);
               setPreview(objUrl);
               setRawFile(compressed);
               onFileSelect(compressed);
            } else {
               // Needs crop
               setImgSrc(src);
               setCropModalOpen(true);
            }
          };
        });
        reader.readAsDataURL(compressed);
      } catch (err) {
        console.error("Compression err", err);
      }
    }
  };

  const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    const crop = centerCrop(
      makeAspectCrop({ unit: '%', width: 90 }, aspectRatio, width, height),
      width,
      height
    );
    setCrop(crop);
  };

  const generateCroppedImage = async () => {
    if (!completedCrop || !imgRef.current) return;
    
    const image = imgRef.current;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    
    canvas.width = completedCrop.width * scaleX;
    canvas.height = completedCrop.height * scaleY;

    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(
      image,
      completedCrop.x * scaleX,
      completedCrop.y * scaleY,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY,
      0,
      0,
      canvas.width,
      canvas.height
    );

    canvas.toBlob((blob) => {
      if (!blob) return;
      const file = new File([blob], 'cropped.jpg', { type: 'image/jpeg' });
      const objUrl = URL.createObjectURL(file);
      setPreview(objUrl);
      setRawFile(file);
      onFileSelect(file);
      setCropModalOpen(false);
    }, 'image/jpeg', 0.9);
  };

  const removeImage = () => {
    setPreview(null);
    setRawFile(null);
    onFileSelect(null);
  };

  return (
    <div className="space-y-2">
      {!preview ? (
        <label className="border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors bg-white">
          <UploadCloud className="text-gray-400 mb-2" size={24} />
          <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">{label}</span>
          <span className="text-[10px] text-gray-400 mt-1">PNG, JPG (Auto-Crop 1:1)</span>
          <input type="file" accept="image/*" className="hidden" onChange={onSelectFile} />
        </label>
      ) : (
        <div className="relative border border-gray-200 rounded-lg overflow-hidden group bg-gray-50 h-32 flex items-center justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt="Preview" className="max-h-full max-w-full object-contain" />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
             <button type="button" onClick={() => document.getElementById('reupload-' + label)?.click()} className="p-2 bg-white rounded-full text-gray-700 hover:text-amber-600"><CropIcon size={14}/></button>
             <button type="button" onClick={removeImage} className="p-2 bg-white rounded-full text-red-600 hover:bg-red-50"><X size={14}/></button>
          </div>
          <input id={'reupload-' + label} type="file" accept="image/*" className="hidden" onChange={onSelectFile} />
        </div>
      )}

      {cropModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-gray-900">Crop Image (Required aspect ratio: {aspectRatio})</h3>
              <button onClick={() => setCropModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={20}/></button>
            </div>
            <div className="max-h-[60vh] overflow-auto bg-gray-100 rounded-lg flex justify-center items-center">
              <ReactCrop
                crop={crop}
                onChange={(_, percentCrop) => setCrop(percentCrop)}
                onComplete={(c) => setCompletedCrop(c)}
                aspect={aspectRatio}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img ref={imgRef} src={imgSrc} onLoad={onImageLoad} alt="Crop me" style={{ maxHeight: '60vh' }} />
              </ReactCrop>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={() => setCropModalOpen(false)} className="px-4 py-2 border border-gray-200 rounded text-sm font-bold text-gray-600">Cancel</button>
              <button type="button" onClick={generateCroppedImage} className="px-4 py-2 bg-amber-500 text-white rounded text-sm font-bold">Apply Crop & Upload</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
