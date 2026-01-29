'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Stack,
  TextField,
  FormControl,
  Select,
  MenuItem,
  InputLabel,
  InputAdornment,
  Divider,
  Alert,
  Chip,
} from '@mui/material';
import { Calculator, DollarSign, Percent, TrendingUp, AlertCircle } from 'lucide-react';

export default function PositionSizeCalculatorPage() {
  const [accountBalance, setAccountBalance] = useState('10000');
  const [riskPercent, setRiskPercent] = useState('1');
  const [entryPrice, setEntryPrice] = useState('');
  const [stopLoss, setStopLoss] = useState('');
  const [accountCurrency, setAccountCurrency] = useState('USD');
  const [pairType, setPairType] = useState('forex');
  
  // Calculated values
  const [riskAmount, setRiskAmount] = useState(0);
  const [pipValue, setPipValue] = useState(0);
  const [pips, setPips] = useState(0);
  const [lotSize, setLotSize] = useState(0);
  const [units, setUnits] = useState(0);

  useEffect(() => {
    calculate();
  }, [accountBalance, riskPercent, entryPrice, stopLoss, pairType]);

  const calculate = () => {
    const balance = parseFloat(accountBalance) || 0;
    const risk = parseFloat(riskPercent) || 0;
    const entry = parseFloat(entryPrice) || 0;
    const sl = parseFloat(stopLoss) || 0;
    
    if (balance <= 0 || risk <= 0 || entry <= 0 || sl <= 0) {
      setRiskAmount(0);
      setPips(0);
      setLotSize(0);
      setUnits(0);
      return;
    }
    
    const riskAmt = (balance * risk) / 100;
    setRiskAmount(riskAmt);
    
    // Calculate pips
    let pipDistance = 0;
    if (pairType === 'forex') {
      // For JPY pairs, pip is 0.01, for others 0.0001
      const isJPY = false; // Could be determined from pair name
      const pipSize = isJPY ? 0.01 : 0.0001;
      pipDistance = Math.abs(entry - sl) / pipSize;
    } else if (pairType === 'gold') {
      // Gold: $0.10 per pip
      pipDistance = Math.abs(entry - sl) / 0.10;
    } else if (pairType === 'crypto') {
      // Crypto: depends on price
      pipDistance = Math.abs(entry - sl);
    }
    
    setPips(pipDistance);
    
    if (pipDistance === 0) {
      setLotSize(0);
      setUnits(0);
      return;
    }
    
    // Calculate pip value and lot size
    let calculatedPipValue = 0;
    let calculatedLotSize = 0;
    let calculatedUnits = 0;
    
    if (pairType === 'forex') {
      // Standard lot = 100,000 units, pip value = $10 per standard lot
      calculatedPipValue = 10; // For standard lot
      calculatedLotSize = riskAmt / (pipDistance * calculatedPipValue);
      calculatedUnits = calculatedLotSize * 100000;
    } else if (pairType === 'gold') {
      // Gold: 1 lot = 100 oz, $1 per pip per lot
      calculatedPipValue = 1;
      calculatedLotSize = riskAmt / (pipDistance * calculatedPipValue);
      calculatedUnits = calculatedLotSize * 100;
    } else if (pairType === 'crypto') {
      // Simplified for crypto
      calculatedUnits = riskAmt / Math.abs(entry - sl);
      calculatedLotSize = calculatedUnits / 100000;
      calculatedPipValue = riskAmt / pipDistance;
    }
    
    setPipValue(calculatedPipValue);
    setLotSize(calculatedLotSize);
    setUnits(calculatedUnits);
  };

  const riskLevel = parseFloat(riskPercent);
  const getRiskColor = () => {
    if (riskLevel <= 1) return '#22C55E';
    if (riskLevel <= 2) return '#F59E0B';
    return '#EF4444';
  };

  return (
    <Box sx={{ 
      minHeight: '100vh', 
      bgcolor: '#0a0f1a', 
      py: { xs: 2, md: 4 },
      px: { xs: 2, md: 4 },
    }}>
      <Box sx={{ maxWidth: 900, mx: 'auto' }}>
        {/* Header */}
        <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
          <Box sx={{ p: 1.5, bgcolor: 'rgba(139, 92, 246, 0.2)', borderRadius: 2 }}>
            <Calculator size={24} color="#8B5CF6" />
          </Box>
          <Box>
            <Typography variant="h5" sx={{ color: 'white', fontWeight: 700 }}>
              Position Size Calculator
            </Typography>
            <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.875rem' }}>
              Calculate optimal position size based on risk management
            </Typography>
          </Box>
        </Stack>

        {/* Risk Warning */}
        {riskLevel > 2 && (
          <Alert 
            severity="warning"
            icon={<AlertCircle size={20} />}
            sx={{ mb: 3, bgcolor: 'rgba(245, 158, 11, 0.1)', color: '#F59E0B' }}
          >
            Risk over 2% per trade is considered aggressive. Most professional traders risk 1-2% maximum.
          </Alert>
        )}

        <Stack direction={{ xs: 'column', lg: 'row' }} spacing={3}>
          {/* Input Section */}
          <Card sx={{ 
            flex: 1,
            bgcolor: 'rgba(255,255,255,0.02)', 
            border: '1px solid rgba(255,255,255,0.1)',
          }}>
            <CardContent sx={{ p: 3 }}>
              <Typography sx={{ color: 'white', fontWeight: 600, mb: 2, fontSize: '1.1rem' }}>
                Trade Parameters
              </Typography>
              
              <Stack spacing={2.5}>
                {/* Account Balance */}
                <TextField
                  label="Account Balance"
                  type="number"
                  value={accountBalance}
                  onChange={(e) => setAccountBalance(e.target.value)}
                  InputProps={{
                    startAdornment: <InputAdornment position="start"><DollarSign size={18} color="rgba(255,255,255,0.5)" /></InputAdornment>,
                  }}
                  sx={{
                    '& .MuiInputBase-root': { color: 'white' },
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.2)' },
                    '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.5)' },
                  }}
                />

                {/* Risk Percentage */}
                <Box>
                  <TextField
                    label="Risk Per Trade"
                    type="number"
                    value={riskPercent}
                    onChange={(e) => setRiskPercent(e.target.value)}
                    inputProps={{ step: 0.1, min: 0, max: 100 }}
                    InputProps={{
                      startAdornment: <InputAdornment position="start"><Percent size={18} color="rgba(255,255,255,0.5)" /></InputAdornment>,
                      endAdornment: (
                        <Chip
                          label={riskLevel <= 1 ? 'Conservative' : riskLevel <= 2 ? 'Moderate' : 'Aggressive'}
                          size="small"
                          sx={{
                            bgcolor: `${getRiskColor()}20`,
                            color: getRiskColor(),
                            fontSize: '0.7rem',
                          }}
                        />
                      ),
                    }}
                    sx={{
                      '& .MuiInputBase-root': { color: 'white' },
                      '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.2)' },
                      '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.5)' },
                    }}
                  />
                  <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                    {['0.5', '1', '2', '3'].map(val => (
                      <Chip
                        key={val}
                        label={`${val}%`}
                        size="small"
                        onClick={() => setRiskPercent(val)}
                        sx={{
                          bgcolor: riskPercent === val ? 'rgba(139, 92, 246, 0.3)' : 'rgba(255,255,255,0.05)',
                          color: riskPercent === val ? '#8B5CF6' : 'rgba(255,255,255,0.5)',
                          cursor: 'pointer',
                          '&:hover': { bgcolor: 'rgba(139, 92, 246, 0.2)' },
                        }}
                      />
                    ))}
                  </Stack>
                </Box>

                {/* Asset Type */}
                <FormControl fullWidth>
                  <InputLabel sx={{ color: 'rgba(255,255,255,0.5)' }}>Asset Type</InputLabel>
                  <Select
                    value={pairType}
                    onChange={(e) => setPairType(e.target.value)}
                    label="Asset Type"
                    sx={{ 
                      color: 'white',
                      '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.2)' },
                    }}
                  >
                    <MenuItem value="forex">Forex</MenuItem>
                    <MenuItem value="gold">Gold/Metals</MenuItem>
                    <MenuItem value="crypto">Crypto</MenuItem>
                  </Select>
                </FormControl>

                <Divider sx={{ bgcolor: 'rgba(255,255,255,0.1)', my: 1 }} />

                {/* Entry Price */}
                <TextField
                  label="Entry Price"
                  type="number"
                  value={entryPrice}
                  onChange={(e) => setEntryPrice(e.target.value)}
                  inputProps={{ step: 0.00001 }}
                  sx={{
                    '& .MuiInputBase-root': { color: 'white' },
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.2)' },
                    '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.5)' },
                  }}
                />

                {/* Stop Loss */}
                <TextField
                  label="Stop Loss"
                  type="number"
                  value={stopLoss}
                  onChange={(e) => setStopLoss(e.target.value)}
                  inputProps={{ step: 0.00001 }}
                  sx={{
                    '& .MuiInputBase-root': { color: 'white' },
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.2)' },
                    '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.5)' },
                  }}
                />
              </Stack>
            </CardContent>
          </Card>

          {/* Results Section */}
          <Card sx={{ 
            flex: 1,
            bgcolor: 'rgba(139, 92, 246, 0.05)', 
            border: '1px solid rgba(139, 92, 246, 0.2)',
          }}>
            <CardContent sx={{ p: 3 }}>
              <Typography sx={{ color: 'white', fontWeight: 600, mb: 3, fontSize: '1.1rem' }}>
                Calculated Results
              </Typography>
              
              <Stack spacing={2.5}>
                {/* Risk Amount */}
                <Box>
                  <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem', mb: 0.5 }}>
                    Risk Amount
                  </Typography>
                  <Stack direction="row" alignItems="baseline" spacing={0.5}>
                    <DollarSign size={20} color="#F59E0B" />
                    <Typography sx={{ color: '#F59E0B', fontSize: '1.8rem', fontWeight: 700 }}>
                      {riskAmount.toFixed(2)}
                    </Typography>
                  </Stack>
                </Box>

                <Divider sx={{ bgcolor: 'rgba(255,255,255,0.1)' }} />

                {/* Pips */}
                <Box>
                  <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem', mb: 0.5 }}>
                    Distance to Stop Loss
                  </Typography>
                  <Typography sx={{ color: 'white', fontSize: '1.5rem', fontWeight: 600 }}>
                    {pips.toFixed(1)} pips
                  </Typography>
                </Box>

                {/* Lot Size */}
                <Box sx={{ 
                  p: 2.5, 
                  bgcolor: 'rgba(139, 92, 246, 0.15)', 
                  borderRadius: 2,
                  border: '1px solid rgba(139, 92, 246, 0.3)',
                }}>
                  <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                    <TrendingUp size={18} color="#8B5CF6" />
                    <Typography sx={{ color: '#8B5CF6', fontSize: '0.85rem', fontWeight: 600 }}>
                      POSITION SIZE
                    </Typography>
                  </Stack>
                  <Typography sx={{ color: 'white', fontSize: '2.2rem', fontWeight: 700, lineHeight: 1 }}>
                    {lotSize.toFixed(2)}
                  </Typography>
                  <Typography sx={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem', mt: 0.5 }}>
                    lots ({units.toFixed(0)} units)
                  </Typography>
                </Box>

                {/* Pip Value */}
                <Box>
                  <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem', mb: 0.5 }}>
                    Pip Value (per standard lot)
                  </Typography>
                  <Typography sx={{ color: 'white', fontSize: '1.2rem', fontWeight: 500 }}>
                    ${pipValue.toFixed(2)}
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Stack>

        {/* Info Card */}
        <Card sx={{ 
          bgcolor: 'rgba(59, 130, 246, 0.1)', 
          border: '1px solid rgba(59, 130, 246, 0.2)',
          mt: 3,
        }}>
          <CardContent>
            <Typography sx={{ color: '#3B82F6', fontWeight: 600, mb: 1 }}>
              Risk Management Tips
            </Typography>
            <Typography sx={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem', lineHeight: 1.7 }}>
              • <strong>Never risk more than 1-2%</strong> of your account on a single trade<br/>
              • <strong>Use proper stop losses</strong> on every trade to limit downside<br/>
              • <strong>Maintain consistent position sizing</strong> based on your risk tolerance<br/>
              • <strong>Account for spread and slippage</strong> when setting stop losses<br/>
              • <strong>Review and adjust</strong> your position sizes as your account grows
            </Typography>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}
