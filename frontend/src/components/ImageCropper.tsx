'use client';

import { useState, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Slider,
  Typography,
  Box,
  Stack,
  IconButton,
} from '@mui/material';
import { ZoomIn, ZoomOut, RotateCw, X } from 'lucide-react';

interface ImageCropperProps {
  open: boolean;
  image: string;
  onClose: () => void;
  onCropComplete: (croppedImage: Blob) => void;
  aspectRatio?: number;
  title?: string;
}

interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

export default function ImageCropper({
  open,
  image,
  onClose,
  onCropComplete,
  aspectRatio = 16 / 9,
  title = 'Crop Image',
}: ImageCropperProps) {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [containerSize, setContainerSize] = useState({ width: 400, height: 300 });

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleZoomChange = (_: Event, value: number | number[]) => {
    setZoom(value as number);
  };

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const getCroppedImg = useCallback(async (): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }

        // Calculate crop dimensions based on aspect ratio
        const cropWidth = containerSize.width;
        const cropHeight = containerSize.width / aspectRatio;

        // Set canvas size to the crop area
        canvas.width = cropWidth;
        canvas.height = cropHeight;

        // Fill with white background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, cropWidth, cropHeight);

        // Calculate the scaled image dimensions
        const scaledWidth = img.width * zoom;
        const scaledHeight = img.height * zoom;

        // Calculate center offset
        const offsetX = (cropWidth - scaledWidth) / 2 + position.x;
        const offsetY = (cropHeight - scaledHeight) / 2 + position.y;

        // Apply rotation
        ctx.save();
        ctx.translate(cropWidth / 2, cropHeight / 2);
        ctx.rotate((rotation * Math.PI) / 180);
        ctx.translate(-cropWidth / 2, -cropHeight / 2);

        // Draw the image
        ctx.drawImage(img, offsetX, offsetY, scaledWidth, scaledHeight);
        ctx.restore();

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Could not create blob'));
            }
          },
          'image/jpeg',
          0.92
        );
      };
      img.onerror = () => reject(new Error('Could not load image'));
      img.src = image;
    });
  }, [image, zoom, rotation, position, aspectRatio, containerSize]);

  const handleCrop = async () => {
    try {
      const croppedBlob = await getCroppedImg();
      onCropComplete(croppedBlob);
      onClose();
    } catch (error) {
      console.error('Error cropping image:', error);
    }
  };

  const handleReset = () => {
    setZoom(1);
    setRotation(0);
    setPosition({ x: 0, y: 0 });
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: '#1a1f2e',
          border: '1px solid rgba(255,255,255,0.1)',
        },
      }}
    >
      <DialogTitle sx={{ color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {title}
        <IconButton onClick={onClose} sx={{ color: 'rgba(255,255,255,0.5)' }}>
          <X size={20} />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        {/* Crop Area */}
        <Box
          sx={{
            position: 'relative',
            width: '100%',
            height: 350,
            bgcolor: '#0a0f1a',
            borderRadius: 2,
            overflow: 'hidden',
            cursor: isDragging ? 'grabbing' : 'grab',
            mb: 3,
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {/* Image */}
          <Box
            component="img"
            src={image}
            alt="Crop preview"
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: `translate(-50%, -50%) translate(${position.x}px, ${position.y}px) scale(${zoom}) rotate(${rotation}deg)`,
              maxWidth: 'none',
              maxHeight: 'none',
              transition: isDragging ? 'none' : 'transform 0.1s ease',
              userSelect: 'none',
              pointerEvents: 'none',
            }}
            onLoad={(e) => {
              const img = e.target as HTMLImageElement;
              setImageSize({ width: img.naturalWidth, height: img.naturalHeight });
            }}
          />

          {/* Crop Overlay */}
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '80%',
              aspectRatio: `${aspectRatio}`,
              border: '2px dashed #8B5CF6',
              borderRadius: 1,
              pointerEvents: 'none',
              boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)',
            }}
          />

          {/* Grid Lines */}
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '80%',
              aspectRatio: `${aspectRatio}`,
              pointerEvents: 'none',
              '&::before, &::after': {
                content: '""',
                position: 'absolute',
                bgcolor: 'rgba(255,255,255,0.2)',
              },
              '&::before': {
                top: '33.33%',
                left: 0,
                right: 0,
                height: '1px',
                boxShadow: '0 calc(100% / 3 * 2 - 1px) 0 0 rgba(255,255,255,0.2)',
              },
              '&::after': {
                left: '33.33%',
                top: 0,
                bottom: 0,
                width: '1px',
                boxShadow: 'calc(100% / 3 * 2 - 1px) 0 0 0 rgba(255,255,255,0.2)',
              },
            }}
          />
        </Box>

        {/* Controls */}
        <Stack spacing={3}>
          {/* Zoom Control */}
          <Box>
            <Stack direction="row" alignItems="center" spacing={2}>
              <ZoomOut size={18} color="rgba(255,255,255,0.5)" />
              <Slider
                value={zoom}
                onChange={handleZoomChange}
                min={0.5}
                max={3}
                step={0.1}
                sx={{
                  color: '#8B5CF6',
                  '& .MuiSlider-thumb': {
                    bgcolor: '#8B5CF6',
                  },
                  '& .MuiSlider-track': {
                    bgcolor: '#8B5CF6',
                  },
                  '& .MuiSlider-rail': {
                    bgcolor: 'rgba(255,255,255,0.2)',
                  },
                }}
              />
              <ZoomIn size={18} color="rgba(255,255,255,0.5)" />
              <Typography sx={{ color: 'rgba(255,255,255,0.6)', minWidth: 50 }}>
                {Math.round(zoom * 100)}%
              </Typography>
            </Stack>
          </Box>

          {/* Action Buttons */}
          <Stack direction="row" spacing={2} justifyContent="center">
            <Button
              onClick={handleRotate}
              startIcon={<RotateCw size={18} />}
              sx={{
                color: 'rgba(255,255,255,0.7)',
                borderColor: 'rgba(255,255,255,0.2)',
                '&:hover': { borderColor: 'rgba(255,255,255,0.4)' },
              }}
              variant="outlined"
            >
              Rotate 90°
            </Button>
            <Button
              onClick={handleReset}
              sx={{
                color: 'rgba(255,255,255,0.7)',
                borderColor: 'rgba(255,255,255,0.2)',
                '&:hover': { borderColor: 'rgba(255,255,255,0.4)' },
              }}
              variant="outlined"
            >
              Reset
            </Button>
          </Stack>

          <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem', textAlign: 'center' }}>
            Drag the image to reposition. Use the slider to zoom in/out.
          </Typography>
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={onClose} sx={{ color: 'rgba(255,255,255,0.6)' }}>
          Cancel
        </Button>
        <Button
          onClick={handleCrop}
          variant="contained"
          sx={{
            bgcolor: '#8B5CF6',
            '&:hover': { bgcolor: '#7C3AED' },
          }}
        >
          Apply Crop
        </Button>
      </DialogActions>
    </Dialog>
  );
}
