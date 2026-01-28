'use client';

import { useState, useRef } from 'react';
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
  Upload, 
  Camera, 
  CreditCard, 
  CheckCircle, 
  AlertCircle,
  Shield,
  FileText,
  User,
} from 'lucide-react';

interface VerificationModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  walletBalance: number;
}

const VERIFICATION_FEE = 50;

const ID_TYPES = [
  { value: 'national_id', label: 'National ID Card' },
  { value: 'driving_license', label: 'Driving License' },
  { value: 'passport', label: 'Passport' },
];

export default function VerificationModal({ open, onClose, onSuccess, walletBalance }: VerificationModalProps) {
  const [activeStep, setActiveStep] = useState(0);
  const [idType, setIdType] = useState('');
  const [idFront, setIdFront] = useState<File | null>(null);
  const [idBack, setIdBack] = useState<File | null>(null);
  const [selfie, setSelfie] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const idFrontRef = useRef<HTMLInputElement>(null);
  const idBackRef = useRef<HTMLInputElement>(null);
  const selfieRef = useRef<HTMLInputElement>(null);

  const canAfford = walletBalance >= VERIFICATION_FEE;
  const steps = ['Select ID Type', 'Upload Documents', 'Review & Submit'];

  const handleFileChange = (setter: (file: File | null) => void) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setError('File size must be less than 10MB');
        return;
      }
      // Validate file type
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        setError('Only JPEG, PNG, and WebP images are allowed');
        return;
      }
      setter(file);
      setError('');
    }
  };

  const handleNext = () => {
    if (activeStep === 0 && !idType) {
      setError('Please select an ID type');
      return;
    }
    if (activeStep === 1) {
      if (!idFront || !idBack || !selfie) {
        setError('Please upload all required documents');
        return;
      }
    }
    setError('');
    setActiveStep((prev) => prev + 1);
  };

  const handleBack = () => {
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
        onClose();
        // Reset form
        setActiveStep(0);
        setIdType('');
        setIdFront(null);
        setIdBack(null);
        setSelfie(null);
      } else {
        setError(data.error || 'Failed to submit verification request');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderFileUpload = (
    label: string,
    file: File | null,
    inputRef: React.RefObject<HTMLInputElement>,
    icon: React.ReactNode,
    description: string
  ) => (
    <Paper
      sx={{
        p: 2,
        bgcolor: file ? 'rgba(34, 197, 94, 0.1)' : 'rgba(255,255,255,0.03)',
        border: file ? '2px solid #22C55E' : '2px dashed rgba(255,255,255,0.2)',
        borderRadius: 2,
        cursor: 'pointer',
        transition: 'all 0.2s',
        '&:hover': {
          borderColor: file ? '#22C55E' : 'rgba(139, 92, 246, 0.5)',
          bgcolor: file ? 'rgba(34, 197, 94, 0.15)' : 'rgba(139, 92, 246, 0.1)',
        },
      }}
      onClick={() => inputRef.current?.click()}
    >
      <Stack direction="row" spacing={2} alignItems="center">
        <Box
          sx={{
            p: 1.5,
            bgcolor: file ? 'rgba(34, 197, 94, 0.2)' : 'rgba(139, 92, 246, 0.2)',
            borderRadius: 2,
          }}
        >
          {file ? <CheckCircle size={24} color="#22C55E" /> : icon}
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{ color: 'white', fontWeight: 600 }}>{label}</Typography>
          <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem' }}>
            {file ? file.name : description}
          </Typography>
        </Box>
        {file && (
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              if (label.includes('Front')) setIdFront(null);
              else if (label.includes('Back')) setIdBack(null);
              else setSelfie(null);
            }}
            sx={{ color: 'rgba(255,255,255,0.5)' }}
          >
            <X size={18} />
          </IconButton>
        )}
      </Stack>
    </Paper>
  );

  return (
    <Dialog
      open={open}
      onClose={onClose}
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
        <IconButton onClick={onClose} sx={{ color: 'rgba(255,255,255,0.5)' }}>
          <X size={20} />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        {/* Balance Warning */}
        {!canAfford && (
          <Alert severity="error" sx={{ mb: 3 }}>
            <Typography sx={{ fontWeight: 600 }}>Insufficient Balance</Typography>
            <Typography variant="body2">
              Verification costs ${VERIFICATION_FEE}. Your current balance is ${walletBalance.toFixed(2)}.
              Please deposit ${(VERIFICATION_FEE - walletBalance).toFixed(2)} more to proceed.
            </Typography>
          </Alert>
        )}

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
              <Typography sx={{ color: canAfford ? '#22C55E' : '#EF4444', fontWeight: 700, fontSize: '1.25rem' }}>
                ${walletBalance.toFixed(2)}
              </Typography>
            </Box>
          </Stack>
        </Paper>

        {/* Stepper */}
        <Stepper activeStep={activeStep} sx={{ mb: 3 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel
                sx={{
                  '& .MuiStepLabel-label': { color: 'rgba(255,255,255,0.5)' },
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

        {/* Step Content */}
        {activeStep === 0 && (
          <Box>
            <Typography sx={{ color: 'rgba(255,255,255,0.7)', mb: 2 }}>
              Select the type of ID document you will upload:
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
          </Box>
        )}

        {activeStep === 1 && (
          <Stack spacing={2}>
            <Typography sx={{ color: 'rgba(255,255,255,0.7)', mb: 1 }}>
              Upload clear photos of your ID document and a selfie:
            </Typography>
            
            <input
              type="file"
              ref={idFrontRef}
              hidden
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileChange(setIdFront)}
            />
            {renderFileUpload(
              'ID Front',
              idFront,
              idFrontRef,
              <CreditCard size={24} color="#8B5CF6" />,
              'Front side of your ID document'
            )}

            <input
              type="file"
              ref={idBackRef}
              hidden
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileChange(setIdBack)}
            />
            {renderFileUpload(
              'ID Back',
              idBack,
              idBackRef,
              <FileText size={24} color="#8B5CF6" />,
              'Back side of your ID document'
            )}

            <input
              type="file"
              ref={selfieRef}
              hidden
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileChange(setSelfie)}
            />
            {renderFileUpload(
              'Selfie with ID',
              selfie,
              selfieRef,
              <User size={24} color="#8B5CF6" />,
              'Photo of you holding your ID next to your face'
            )}

            <Alert severity="info" sx={{ mt: 1 }}>
              <Typography variant="body2">
                Make sure all text on your ID is clearly readable. Your selfie should show your face and the ID document together.
              </Typography>
            </Alert>
          </Stack>
        )}

        {activeStep === 2 && (
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
                  Documents
                </Typography>
                <Stack spacing={1}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CheckCircle size={16} color="#22C55E" />
                    <Typography sx={{ color: 'white', fontSize: '0.875rem' }}>ID Front: {idFront?.name}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CheckCircle size={16} color="#22C55E" />
                    <Typography sx={{ color: 'white', fontSize: '0.875rem' }}>ID Back: {idBack?.name}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CheckCircle size={16} color="#22C55E" />
                    <Typography sx={{ color: 'white', fontSize: '0.875rem' }}>Selfie: {selfie?.name}</Typography>
                  </Box>
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
        <Button onClick={onClose} sx={{ color: 'rgba(255,255,255,0.5)' }}>
          Cancel
        </Button>
        {activeStep < 2 ? (
          <Button
            variant="contained"
            onClick={handleNext}
            sx={{ bgcolor: '#8B5CF6', '&:hover': { bgcolor: '#7C3AED' } }}
          >
            Next
          </Button>
        ) : (
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={loading || !canAfford}
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
