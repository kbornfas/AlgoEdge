'use client';

import { useState, useRef, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  TextField,
  MenuItem,
  Alert,
  CircularProgress,
  Stack,
  Paper,
  IconButton,
  Stepper,
  Step,
  StepLabel,
} from '@mui/material';
import { 
  X, 
  Camera, 
  CreditCard, 
  CheckCircle, 
  AlertCircle,
  Shield,
  FileText,
  RefreshCcw,
  ArrowLeft,
  ArrowRight,
  User,
} from 'lucide-react';

interface VerificationModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  walletBalance: number;
  isAlreadyVerified?: boolean;
}

const VERIFICATION_FEE = 50;

const ID_TYPES = [
  { value: 'national_id', label: 'National ID Card' },
  { value: 'driving_license', label: 'Driving License' },
  { value: 'passport', label: 'Passport' },
];

type LivenessStep = 'center' | 'left' | 'right' | 'complete';

export default function VerificationModal({ open, onClose, onSuccess, walletBalance, isAlreadyVerified }: VerificationModalProps) {
  const [activeStep, setActiveStep] = useState(0);
  const [idType, setIdType] = useState('');
  const [idFront, setIdFront] = useState<File | null>(null);
  const [idFrontPreview, setIdFrontPreview] = useState<string | null>(null);
  const [idBack, setIdBack] = useState<File | null>(null);
  const [idBackPreview, setIdBackPreview] = useState<string | null>(null);
  const [selfie, setSelfie] = useState<File | null>(null);
  const [selfiePreview, setSelfiePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Camera states
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  // Liveness detection states
  const [livenessStep, setLivenessStep] = useState<LivenessStep>('center');
  const [livenessPhotos, setLivenessPhotos] = useState<{center?: string, left?: string, right?: string}>({});
  const [countdown, setCountdown] = useState<number | null>(null);

  const canAfford = walletBalance >= VERIFICATION_FEE;
  const steps = ['ID Type', 'ID Front', 'ID Back', 'Liveness Check', 'Review'];

  // Cleanup camera on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Stop camera when modal closes
  useEffect(() => {
    if (!open && streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      setCameraActive(false);
    }
  }, [open]);

  const startCamera = async (facingMode: 'user' | 'environment' = 'environment') => {
    try {
      setCameraError('');
      // Stop existing stream first
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: facingMode,
          width: { ideal: 1280 }, 
          height: { ideal: 720 } 
        }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraActive(true);
    } catch (err: any) {
      console.error('Camera error:', err);
      setCameraError('Unable to access camera. Please ensure camera permissions are granted.');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  const capturePhoto = (target: 'front' | 'back' | 'selfie', livenessType?: 'center' | 'left' | 'right') => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Mirror for selfie (front camera)
        if (target === 'selfie') {
          ctx.translate(canvas.width, 0);
          ctx.scale(-1, 1);
        }
        ctx.drawImage(video, 0, 0);
        
        const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
        
        canvas.toBlob((blob) => {
          if (blob) {
            const timestamp = Date.now();
            
            if (target === 'front') {
              const file = new File([blob], `id_front_${timestamp}.jpg`, { type: 'image/jpeg' });
              setIdFront(file);
              setIdFrontPreview(dataUrl);
              stopCamera();
            } else if (target === 'back') {
              const file = new File([blob], `id_back_${timestamp}.jpg`, { type: 'image/jpeg' });
              setIdBack(file);
              setIdBackPreview(dataUrl);
              stopCamera();
            } else if (target === 'selfie' && livenessType) {
              // Store liveness photo
              const newPhotos = { ...livenessPhotos, [livenessType]: dataUrl };
              setLivenessPhotos(newPhotos);
              
              // Move to next liveness step
              if (livenessType === 'center') {
                setLivenessStep('left');
                setCountdown(3);
              } else if (livenessType === 'left') {
                setLivenessStep('right');
                setCountdown(3);
              } else if (livenessType === 'right') {
                // All done - use center photo as main selfie
                const file = new File([blob], `selfie_${timestamp}.jpg`, { type: 'image/jpeg' });
                setSelfie(file);
                // Use center photo for preview
                setSelfiePreview(newPhotos.center || dataUrl);
                setLivenessStep('complete');
                stopCamera();
              }
            }
          }
        }, 'image/jpeg', 0.9);
      }
    }
  };

  // Countdown timer for liveness
  useEffect(() => {
    if (countdown !== null && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0) {
      // Auto-capture after countdown
      capturePhoto('selfie', livenessStep as 'center' | 'left' | 'right');
      setCountdown(null);
    }
  }, [countdown, livenessStep]);

  const retakePhoto = (target: 'front' | 'back' | 'selfie') => {
    if (target === 'front') {
      setIdFront(null);
      setIdFrontPreview(null);
      startCamera('environment');
    } else if (target === 'back') {
      setIdBack(null);
      setIdBackPreview(null);
      startCamera('environment');
    } else {
      setSelfie(null);
      setSelfiePreview(null);
      setLivenessPhotos({});
      setLivenessStep('center');
      startCamera('user');
    }
  };

  const handleNext = () => {
    if (activeStep === 0 && !idType) {
      setError('Please select an ID type');
      return;
    }
    if (activeStep === 1 && !idFront) {
      setError('Please capture the front of your ID');
      return;
    }
    if (activeStep === 2 && !idBack) {
      setError('Please capture the back of your ID');
      return;
    }
    if (activeStep === 3 && !selfie) {
      setError('Please complete the liveness check');
      return;
    }
    setError('');
    
    // Start camera for next step
    if (activeStep === 0) {
      startCamera('environment'); // Back camera for ID
    } else if (activeStep === 1) {
      startCamera('environment');
    } else if (activeStep === 2) {
      setLivenessStep('center');
      startCamera('user'); // Front camera for selfie
    }
    
    setActiveStep((prev) => prev + 1);
  };

  const handleBack = () => {
    stopCamera();
    setActiveStep((prev) => prev - 1);
    setError('');
  };

  const handleSubmit = async () => {
    if (!canAfford) {
      setError(`Insufficient balance. You need $${VERIFICATION_FEE} but only have $${walletBalance.toFixed(2)}`);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('id_type', idType);
      formData.append('id_front', idFront!);
      formData.append('id_back', idBack!);
      formData.append('selfie', selfie!);

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/verification/submit`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await res.json();

      if (res.ok) {
        onSuccess();
        handleClose();
      } else {
        setError(data.error || 'Failed to submit verification request');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    stopCamera();
    setActiveStep(0);
    setIdType('');
    setIdFront(null);
    setIdFrontPreview(null);
    setIdBack(null);
    setIdBackPreview(null);
    setSelfie(null);
    setSelfiePreview(null);
    setLivenessPhotos({});
    setLivenessStep('center');
    setCountdown(null);
    setError('');
    onClose();
  };

  const getLivenessInstruction = () => {
    switch (livenessStep) {
      case 'center':
        return { icon: <User size={24} />, text: 'Look straight at the camera', color: '#8B5CF6' };
      case 'left':
        return { icon: <ArrowLeft size={24} />, text: 'Turn your head LEFT', color: '#F59E0B' };
      case 'right':
        return { icon: <ArrowRight size={24} />, text: 'Turn your head RIGHT', color: '#22C55E' };
      default:
        return { icon: <CheckCircle size={24} />, text: 'Liveness check complete!', color: '#22C55E' };
    }
  };

  // Already verified - show success message
  if (isAlreadyVerified) {
    return (
      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: '#0f1629',
            border: '1px solid rgba(34, 197, 94, 0.3)',
            borderRadius: 3,
          },
        }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <CheckCircle size={24} color="#22C55E" />
            <Typography variant="h6" sx={{ color: 'white', fontWeight: 700 }}>
              Already Verified
            </Typography>
          </Stack>
          <IconButton onClick={handleClose} sx={{ color: 'rgba(255,255,255,0.5)' }}>
            <X size={20} />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Box
              sx={{
                width: 80,
                height: 80,
                borderRadius: '50%',
                bgcolor: 'rgba(34, 197, 94, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mx: 'auto',
                mb: 3,
              }}
            >
              <Shield size={40} color="#22C55E" />
            </Box>
            <Typography variant="h5" sx={{ color: 'white', fontWeight: 700, mb: 2 }}>
              You&apos;re Already Verified! 🎉
            </Typography>
            <Typography sx={{ color: 'rgba(255,255,255,0.7)', mb: 3 }}>
              Your seller account has the verified badge. You have access to all verified seller benefits including:
            </Typography>
            <Stack spacing={1.5} sx={{ textAlign: 'left', maxWidth: 300, mx: 'auto' }}>
              <Stack direction="row" spacing={1} alignItems="center">
                <CheckCircle size={18} color="#22C55E" />
                <Typography sx={{ color: 'rgba(255,255,255,0.8)' }}>Verified badge on all listings</Typography>
              </Stack>
              <Stack direction="row" spacing={1} alignItems="center">
                <CheckCircle size={18} color="#22C55E" />
                <Typography sx={{ color: 'rgba(255,255,255,0.8)' }}>Higher visibility in search</Typography>
              </Stack>
              <Stack direction="row" spacing={1} alignItems="center">
                <CheckCircle size={18} color="#22C55E" />
                <Typography sx={{ color: 'rgba(255,255,255,0.8)' }}>Increased buyer confidence</Typography>
              </Stack>
            </Stack>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 0, justifyContent: 'center' }}>
          <Button
            variant="contained"
            onClick={handleClose}
            sx={{ bgcolor: '#22C55E', '&:hover': { bgcolor: '#16A34A' }, minWidth: 120 }}
          >
            Got it!
          </Button>
        </DialogActions>
      </Dialog>
    );
  }

  // Don't render if can't afford - show error message instead
  if (!canAfford) {
    return (
      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: '#0f1629',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: 3,
          },
        }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <AlertCircle size={24} color="#EF4444" />
            <Typography variant="h6" sx={{ color: 'white', fontWeight: 700 }}>
              Insufficient Balance
            </Typography>
          </Stack>
          <IconButton onClick={handleClose} sx={{ color: 'rgba(255,255,255,0.5)' }}>
            <X size={20} />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Alert severity="error" sx={{ mb: 3 }}>
            <Typography sx={{ fontWeight: 600, mb: 1 }}>You need $50 to get verified</Typography>
            <Typography variant="body2">
              Your current balance is <strong>${walletBalance.toFixed(2)}</strong>.
              Please deposit at least <strong>${(VERIFICATION_FEE - walletBalance).toFixed(2)}</strong> more to proceed with verification.
            </Typography>
          </Alert>
          
          <Paper
            sx={{
              p: 3,
              bgcolor: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 2,
              textAlign: 'center',
            }}
          >
            <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.875rem', mb: 1 }}>
              Verification Fee
            </Typography>
            <Typography sx={{ color: 'white', fontWeight: 800, fontSize: '2rem' }}>
              $50.00
            </Typography>
            <Typography sx={{ color: '#EF4444', fontSize: '0.875rem', mt: 1 }}>
              Your balance: ${walletBalance.toFixed(2)}
            </Typography>
          </Paper>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button onClick={handleClose} sx={{ color: 'rgba(255,255,255,0.5)' }}>
            Close
          </Button>
          <Button
            variant="contained"
            href="/dashboard/wallet"
            sx={{ bgcolor: '#8B5CF6', '&:hover': { bgcolor: '#7C3AED' } }}
          >
            Deposit Funds
          </Button>
        </DialogActions>
      </Dialog>
    );
  }

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: '#0f1629',
          border: '1px solid rgba(139, 92, 246, 0.3)',
          borderRadius: 3,
        },
      }}
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Shield size={24} color="#8B5CF6" />
          <Typography variant="h6" sx={{ color: 'white', fontWeight: 700 }}>
            Get Verified
          </Typography>
        </Stack>
        <IconButton onClick={handleClose} sx={{ color: 'rgba(255,255,255,0.5)' }}>
          <X size={20} />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        {/* Fee Info */}
        <Paper
          sx={{
            p: 2,
            mb: 3,
            bgcolor: 'rgba(139, 92, 246, 0.1)',
            border: '1px solid rgba(139, 92, 246, 0.3)',
            borderRadius: 2,
          }}
        >
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Box>
              <Typography sx={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.875rem' }}>
                Verification Fee
              </Typography>
              <Typography sx={{ color: 'white', fontWeight: 700, fontSize: '1.25rem' }}>
                ${VERIFICATION_FEE}.00
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'right' }}>
              <Typography sx={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.875rem' }}>
                Your Balance
              </Typography>
              <Typography sx={{ color: '#22C55E', fontWeight: 700, fontSize: '1.25rem' }}>
                ${walletBalance.toFixed(2)}
              </Typography>
            </Box>
          </Stack>
        </Paper>

        {/* Stepper */}
        <Stepper activeStep={activeStep} sx={{ mb: 3 }} alternativeLabel>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel
                sx={{
                  '& .MuiStepLabel-label': { color: 'rgba(255,255,255,0.5)', fontSize: '0.65rem' },
                  '& .MuiStepLabel-label.Mui-active': { color: '#8B5CF6' },
                  '& .MuiStepLabel-label.Mui-completed': { color: '#22C55E' },
                }}
              >
                {label}
              </StepLabel>
            </Step>
          ))}
        </Stepper>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {cameraError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {cameraError}
          </Alert>
        )}

        {/* Hidden canvas for capturing */}
        <canvas ref={canvasRef} style={{ display: 'none' }} />

        {/* Step 0: Select ID Type */}
        {activeStep === 0 && (
          <Box>
            <Typography sx={{ color: 'rgba(255,255,255,0.7)', mb: 2 }}>
              Select the type of ID document you will capture:
            </Typography>
            <TextField
              select
              fullWidth
              label="ID Document Type"
              value={idType}
              onChange={(e) => setIdType(e.target.value)}
              sx={{
                '& .MuiOutlinedInput-root': {
                  color: 'white',
                  '& fieldset': { borderColor: 'rgba(255,255,255,0.2)' },
                  '&:hover fieldset': { borderColor: 'rgba(139, 92, 246, 0.5)' },
                  '&.Mui-focused fieldset': { borderColor: '#8B5CF6' },
                },
                '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.5)' },
              }}
            >
              {ID_TYPES.map((type) => (
                <MenuItem key={type.value} value={type.value}>
                  {type.label}
                </MenuItem>
              ))}
            </TextField>
            
            <Alert severity="info" sx={{ mt: 2 }}>
              <Typography variant="body2">
                📸 <strong>All photos will be taken live</strong> using your camera. No file uploads allowed.
                Make sure you have good lighting and your ID is clearly visible.
              </Typography>
            </Alert>
          </Box>
        )}

        {/* Step 1: Capture ID Front */}
        {activeStep === 1 && (
          <Box>
            <Typography sx={{ color: 'rgba(255,255,255,0.7)', mb: 2, textAlign: 'center' }}>
              <CreditCard size={20} style={{ verticalAlign: 'middle', marginRight: 8 }} />
              Capture the <strong>FRONT</strong> of your ID
            </Typography>

            <Paper
              sx={{
                bgcolor: 'rgba(0,0,0,0.3)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 2,
                overflow: 'hidden',
              }}
            >
              {idFrontPreview ? (
                <Box sx={{ p: 2 }}>
                  <Box
                    component="img"
                    src={idFrontPreview}
                    alt="ID Front"
                    sx={{ width: '100%', borderRadius: 2 }}
                  />
                  <Stack direction="row" spacing={1} justifyContent="center" sx={{ mt: 2 }}>
                    <Button
                      variant="outlined"
                      startIcon={<RefreshCcw size={18} />}
                      onClick={() => retakePhoto('front')}
                      sx={{ borderColor: 'rgba(255,255,255,0.3)', color: 'white' }}
                    >
                      Retake
                    </Button>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#22C55E' }}>
                      <CheckCircle size={20} />
                      <Typography>Captured!</Typography>
                    </Box>
                  </Stack>
                </Box>
              ) : cameraActive ? (
                <Box sx={{ p: 2 }}>
                  <Box sx={{ position: 'relative' }}>
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      style={{ width: '100%', borderRadius: 8 }}
                    />
                    {/* ID frame guide */}
                    <Box
                      sx={{
                        position: 'absolute',
                        top: '10%',
                        left: '5%',
                        right: '5%',
                        bottom: '10%',
                        border: '3px dashed rgba(139, 92, 246, 0.7)',
                        borderRadius: 2,
                        pointerEvents: 'none',
                      }}
                    />
                  </Box>
                  <Button
                    variant="contained"
                    startIcon={<Camera size={20} />}
                    onClick={() => capturePhoto('front')}
                    fullWidth
                    sx={{
                      mt: 2,
                      bgcolor: '#8B5CF6',
                      py: 1.5,
                      '&:hover': { bgcolor: '#7C3AED' },
                    }}
                  >
                    Capture ID Front
                  </Button>
                </Box>
              ) : (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <CreditCard size={48} color="#8B5CF6" style={{ marginBottom: 16 }} />
                  <Typography sx={{ color: 'white', mb: 2 }}>Starting camera...</Typography>
                  <CircularProgress size={24} sx={{ color: '#8B5CF6' }} />
                </Box>
              )}
            </Paper>

            <Alert severity="info" sx={{ mt: 2 }}>
              <Typography variant="body2">
                Position your ID within the frame. Ensure all text is clearly visible.
              </Typography>
            </Alert>
          </Box>
        )}

        {/* Step 2: Capture ID Back */}
        {activeStep === 2 && (
          <Box>
            <Typography sx={{ color: 'rgba(255,255,255,0.7)', mb: 2, textAlign: 'center' }}>
              <FileText size={20} style={{ verticalAlign: 'middle', marginRight: 8 }} />
              Capture the <strong>BACK</strong> of your ID
            </Typography>

            <Paper
              sx={{
                bgcolor: 'rgba(0,0,0,0.3)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 2,
                overflow: 'hidden',
              }}
            >
              {idBackPreview ? (
                <Box sx={{ p: 2 }}>
                  <Box
                    component="img"
                    src={idBackPreview}
                    alt="ID Back"
                    sx={{ width: '100%', borderRadius: 2 }}
                  />
                  <Stack direction="row" spacing={1} justifyContent="center" sx={{ mt: 2 }}>
                    <Button
                      variant="outlined"
                      startIcon={<RefreshCcw size={18} />}
                      onClick={() => retakePhoto('back')}
                      sx={{ borderColor: 'rgba(255,255,255,0.3)', color: 'white' }}
                    >
                      Retake
                    </Button>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#22C55E' }}>
                      <CheckCircle size={20} />
                      <Typography>Captured!</Typography>
                    </Box>
                  </Stack>
                </Box>
              ) : cameraActive ? (
                <Box sx={{ p: 2 }}>
                  <Box sx={{ position: 'relative' }}>
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      style={{ width: '100%', borderRadius: 8 }}
                    />
                    {/* ID frame guide */}
                    <Box
                      sx={{
                        position: 'absolute',
                        top: '10%',
                        left: '5%',
                        right: '5%',
                        bottom: '10%',
                        border: '3px dashed rgba(139, 92, 246, 0.7)',
                        borderRadius: 2,
                        pointerEvents: 'none',
                      }}
                    />
                  </Box>
                  <Button
                    variant="contained"
                    startIcon={<Camera size={20} />}
                    onClick={() => capturePhoto('back')}
                    fullWidth
                    sx={{
                      mt: 2,
                      bgcolor: '#8B5CF6',
                      py: 1.5,
                      '&:hover': { bgcolor: '#7C3AED' },
                    }}
                  >
                    Capture ID Back
                  </Button>
                </Box>
              ) : (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <FileText size={48} color="#8B5CF6" style={{ marginBottom: 16 }} />
                  <Typography sx={{ color: 'white', mb: 2 }}>Starting camera...</Typography>
                  <CircularProgress size={24} sx={{ color: '#8B5CF6' }} />
                </Box>
              )}
            </Paper>
          </Box>
        )}

        {/* Step 3: Liveness Check */}
        {activeStep === 3 && (
          <Box>
            {livenessStep !== 'complete' ? (
              <>
                <Paper
                  sx={{
                    p: 2,
                    mb: 2,
                    bgcolor: `rgba(${livenessStep === 'center' ? '139, 92, 246' : livenessStep === 'left' ? '245, 158, 11' : '34, 197, 94'}, 0.2)`,
                    border: `2px solid ${getLivenessInstruction().color}`,
                    borderRadius: 2,
                    textAlign: 'center',
                  }}
                >
                  <Stack direction="row" spacing={2} justifyContent="center" alignItems="center">
                    <Box sx={{ color: getLivenessInstruction().color }}>
                      {getLivenessInstruction().icon}
                    </Box>
                    <Typography sx={{ color: 'white', fontWeight: 700, fontSize: '1.1rem' }}>
                      {getLivenessInstruction().text}
                    </Typography>
                  </Stack>
                  {countdown !== null && (
                    <Typography sx={{ color: getLivenessInstruction().color, fontSize: '2rem', fontWeight: 800, mt: 1 }}>
                      {countdown}
                    </Typography>
                  )}
                </Paper>

                {/* Progress indicators */}
                <Stack direction="row" spacing={1} justifyContent="center" sx={{ mb: 2 }}>
                  <Box sx={{ 
                    width: 40, height: 6, borderRadius: 3, 
                    bgcolor: livenessPhotos.center ? '#22C55E' : livenessStep === 'center' ? '#8B5CF6' : 'rgba(255,255,255,0.2)' 
                  }} />
                  <Box sx={{ 
                    width: 40, height: 6, borderRadius: 3, 
                    bgcolor: livenessPhotos.left ? '#22C55E' : livenessStep === 'left' ? '#F59E0B' : 'rgba(255,255,255,0.2)' 
                  }} />
                  <Box sx={{ 
                    width: 40, height: 6, borderRadius: 3, 
                    bgcolor: livenessPhotos.right ? '#22C55E' : livenessStep === 'right' ? '#22C55E' : 'rgba(255,255,255,0.2)' 
                  }} />
                </Stack>

                <Paper
                  sx={{
                    bgcolor: 'rgba(0,0,0,0.3)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 2,
                    overflow: 'hidden',
                  }}
                >
                  {cameraActive ? (
                    <Box sx={{ p: 2, position: 'relative' }}>
                      <Box sx={{ position: 'relative' }}>
                        <video
                          ref={videoRef}
                          autoPlay
                          playsInline
                          muted
                          style={{
                            width: '100%',
                            borderRadius: 8,
                            transform: 'scaleX(-1)', // Mirror for selfie
                          }}
                        />
                        {/* Face guide overlay */}
                        <Box
                          sx={{
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            width: 180,
                            height: 240,
                            border: `4px solid ${getLivenessInstruction().color}`,
                            borderRadius: '50%',
                            pointerEvents: 'none',
                          }}
                        />
                        {/* Direction arrow */}
                        {livenessStep === 'left' && (
                          <Box sx={{ position: 'absolute', top: '50%', left: 20, transform: 'translateY(-50%)', color: '#F59E0B' }}>
                            <ArrowLeft size={48} />
                          </Box>
                        )}
                        {livenessStep === 'right' && (
                          <Box sx={{ position: 'absolute', top: '50%', right: 20, transform: 'translateY(-50%)', color: '#22C55E' }}>
                            <ArrowRight size={48} />
                          </Box>
                        )}
                      </Box>
                      
                      <Button
                        variant="contained"
                        startIcon={<Camera size={20} />}
                        onClick={() => {
                          capturePhoto('selfie', livenessStep as 'center' | 'left' | 'right');
                        }}
                        fullWidth
                        sx={{
                          mt: 2,
                          bgcolor: getLivenessInstruction().color,
                          py: 1.5,
                          '&:hover': { filter: 'brightness(0.9)' },
                        }}
                      >
                        Capture
                      </Button>
                    </Box>
                  ) : (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                      <User size={48} color="#8B5CF6" style={{ marginBottom: 16 }} />
                      <Typography sx={{ color: 'white', mb: 2 }}>Starting front camera...</Typography>
                      <CircularProgress size={24} sx={{ color: '#8B5CF6' }} />
                    </Box>
                  )}
                </Paper>
              </>
            ) : (
              // Liveness complete
              <Box sx={{ textAlign: 'center' }}>
                <CheckCircle size={64} color="#22C55E" style={{ marginBottom: 16 }} />
                <Typography variant="h6" sx={{ color: '#22C55E', fontWeight: 700, mb: 2 }}>
                  Liveness Check Passed!
                </Typography>
                
                <Stack direction="row" spacing={1} justifyContent="center" sx={{ mb: 2 }}>
                  {livenessPhotos.center && (
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.65rem', mb: 0.5 }}>Center</Typography>
                      <Box
                        component="img"
                        src={livenessPhotos.center}
                        sx={{ width: 70, height: 70, borderRadius: 2, objectFit: 'cover', transform: 'scaleX(-1)' }}
                      />
                    </Box>
                  )}
                  {livenessPhotos.left && (
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.65rem', mb: 0.5 }}>Left</Typography>
                      <Box
                        component="img"
                        src={livenessPhotos.left}
                        sx={{ width: 70, height: 70, borderRadius: 2, objectFit: 'cover', transform: 'scaleX(-1)' }}
                      />
                    </Box>
                  )}
                  {livenessPhotos.right && (
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.65rem', mb: 0.5 }}>Right</Typography>
                      <Box
                        component="img"
                        src={livenessPhotos.right}
                        sx={{ width: 70, height: 70, borderRadius: 2, objectFit: 'cover', transform: 'scaleX(-1)' }}
                      />
                    </Box>
                  )}
                </Stack>
                
                <Button
                  variant="outlined"
                  startIcon={<RefreshCcw size={18} />}
                  onClick={() => retakePhoto('selfie')}
                  sx={{ borderColor: 'rgba(255,255,255,0.3)', color: 'white' }}
                >
                  Retake Liveness Check
                </Button>
              </Box>
            )}
          </Box>
        )}

        {/* Step 4: Review & Submit */}
        {activeStep === 4 && (
          <Box>
            <Typography sx={{ color: 'rgba(255,255,255,0.7)', mb: 2 }}>
              Please review your submission:
            </Typography>
            
            <Stack spacing={2}>
              <Paper sx={{ p: 2, bgcolor: 'rgba(255,255,255,0.03)', borderRadius: 2 }}>
                <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem' }}>
                  ID Type
                </Typography>
                <Typography sx={{ color: 'white', fontWeight: 600 }}>
                  {ID_TYPES.find(t => t.value === idType)?.label}
                </Typography>
              </Paper>

              <Paper sx={{ p: 2, bgcolor: 'rgba(255,255,255,0.03)', borderRadius: 2 }}>
                <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem', mb: 1 }}>
                  Captured Documents (Live Photos)
                </Typography>
                <Stack direction="row" spacing={2}>
                  {idFrontPreview && (
                    <Box>
                      <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.65rem', mb: 0.5 }}>Front</Typography>
                      <Box
                        component="img"
                        src={idFrontPreview}
                        sx={{ width: 100, height: 65, borderRadius: 1, objectFit: 'cover' }}
                      />
                    </Box>
                  )}
                  {idBackPreview && (
                    <Box>
                      <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.65rem', mb: 0.5 }}>Back</Typography>
                      <Box
                        component="img"
                        src={idBackPreview}
                        sx={{ width: 100, height: 65, borderRadius: 1, objectFit: 'cover' }}
                      />
                    </Box>
                  )}
                  {selfiePreview && (
                    <Box>
                      <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.65rem', mb: 0.5 }}>Selfie</Typography>
                      <Box
                        component="img"
                        src={selfiePreview}
                        sx={{ width: 65, height: 65, borderRadius: 1, objectFit: 'cover', transform: 'scaleX(-1)' }}
                      />
                    </Box>
                  )}
                </Stack>
              </Paper>

              <Paper sx={{ p: 2, bgcolor: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.3)', borderRadius: 2 }}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <CheckCircle size={18} color="#22C55E" />
                  <Typography sx={{ color: 'white', fontSize: '0.875rem' }}>
                    Liveness verification passed (3 positions captured)
                  </Typography>
                </Stack>
              </Paper>

              <Alert severity="warning">
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  ${VERIFICATION_FEE}.00 will be deducted from your wallet
                </Typography>
                <Typography variant="body2">
                  Your documents will be reviewed within 24-48 hours. If rejected, the fee will be refunded.
                </Typography>
              </Alert>
            </Stack>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 0 }}>
        {activeStep > 0 && (
          <Button onClick={handleBack} sx={{ color: 'rgba(255,255,255,0.7)' }}>
            Back
          </Button>
        )}
        <Box sx={{ flex: 1 }} />
        <Button onClick={handleClose} sx={{ color: 'rgba(255,255,255,0.5)' }}>
          Cancel
        </Button>
        {activeStep < 4 ? (
          <Button
            variant="contained"
            onClick={handleNext}
            disabled={
              (activeStep === 0 && !idType) ||
              (activeStep === 1 && !idFront) ||
              (activeStep === 2 && !idBack) ||
              (activeStep === 3 && livenessStep !== 'complete')
            }
            sx={{ bgcolor: '#8B5CF6', '&:hover': { bgcolor: '#7C3AED' } }}
          >
            Next
          </Button>
        ) : (
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <Shield size={18} />}
            sx={{ bgcolor: '#8B5CF6', '&:hover': { bgcolor: '#7C3AED' } }}
          >
            {loading ? 'Submitting...' : 'Submit & Pay $50'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}

