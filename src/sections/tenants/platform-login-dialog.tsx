import { useState, useCallback } from 'react';

import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import TextField from '@mui/material/TextField';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import CircularProgress from '@mui/material/CircularProgress';
import DialogContentText from '@mui/material/DialogContentText';

import { platformSendOtp, platformVerifyOtp } from 'src/services/platform-auth';

// ----------------------------------------------------------------------

type PlatformAuthStep = 'mobile' | 'otp';

type Props = {
  open: boolean;
  onSuccess: () => void;
};

export function PlatformLoginDialog({ open, onSuccess }: Props) {
  const [step, setStep] = useState<PlatformAuthStep>('mobile');
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleSendOtp = useCallback(async () => {
    if (!mobile || mobile.length < 10) {
      setErrorMessage('Please enter a valid mobile number');
      return;
    }
    setLoading(true);
    setErrorMessage('');
    try {
      const response = await platformSendOtp(mobile);
      if (response.success) {
        setSuccessMessage(response.message || 'OTP sent successfully');
        setStep('otp');
      }
    } catch (error: any) {
      setErrorMessage(error.message || 'Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [mobile]);

  const handleVerifyOtp = useCallback(async () => {
    if (!otp || otp.length < 4) {
      setErrorMessage('Please enter a valid OTP');
      return;
    }
    setLoading(true);
    setErrorMessage('');
    try {
      const response = await platformVerifyOtp(mobile, otp);
      if (response.success) {
        onSuccess();
      }
    } catch (error: any) {
      setErrorMessage(error.message || 'Invalid OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [mobile, otp, onSuccess]);

  const handleBackToMobile = useCallback(() => {
    setStep('mobile');
    setOtp('');
    setErrorMessage('');
    setSuccessMessage('');
  }, []);

  return (
    <Dialog open={open} maxWidth="xs" fullWidth>
      <DialogTitle>Platform Sign In</DialogTitle>
      <DialogContent>
        <DialogContentText sx={{ mb: 3 }}>
          {step === 'mobile'
            ? 'Platform control requires a super-admin login. Enter your mobile number to receive an OTP.'
            : `Enter the OTP sent to ${mobile}.`}
        </DialogContentText>

        {step === 'mobile' ? (
          <TextField
            fullWidth
            name="mobile"
            label="Mobile Number"
            value={mobile}
            onChange={(event) => {
              setMobile(event.target.value);
              if (errorMessage) setErrorMessage('');
            }}
            placeholder="Enter your mobile number"
            disabled={loading}
            slotProps={{ inputLabel: { shrink: true } }}
          />
        ) : (
          <>
            {successMessage && (
              <Alert severity="success" sx={{ mb: 2 }}>
                {successMessage}
              </Alert>
            )}
            <TextField
              fullWidth
              name="otp"
              label="Enter OTP"
              value={otp}
              onChange={(event) => {
                setOtp(event.target.value);
                if (errorMessage) setErrorMessage('');
              }}
              placeholder="Enter the OTP sent to your mobile"
              disabled={loading}
              slotProps={{ inputLabel: { shrink: true } }}
            />
          </>
        )}

        {errorMessage && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {errorMessage}
          </Alert>
        )}
      </DialogContent>
      <DialogActions>
        {step === 'otp' && (
          <Button onClick={handleBackToMobile} disabled={loading} color="inherit">
            Back
          </Button>
        )}
        <Button
          variant="contained"
          disabled={loading}
          onClick={step === 'mobile' ? handleSendOtp : handleVerifyOtp}
        >
          {loading ? (
            <CircularProgress size={20} />
          ) : step === 'mobile' ? (
            'Send OTP'
          ) : (
            'Verify OTP'
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
