import { useState, useCallback } from 'react';

import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';

import { useRouter } from 'src/routes/hooks';

import { sendOtp, verifyOtp } from 'src/services/auth';

// ----------------------------------------------------------------------

type AuthStep = 'mobile' | 'otp';

export function SignInView() {
  const router = useRouter();

  const [step, setStep] = useState<AuthStep>('mobile');
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleMobileChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setMobile(event.target.value);
      if (errorMessage) {
        setErrorMessage('');
      }
    },
    [errorMessage]
  );

  const handleOtpChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setOtp(event.target.value);
      if (errorMessage) {
        setErrorMessage('');
      }
    },
    [errorMessage]
  );

  const handleSendOtp = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      // Validate mobile number
      if (!mobile || mobile.length < 10) {
        setErrorMessage('Please enter a valid mobile number');
        return;
      }

      setLoading(true);
      setErrorMessage('');

      try {
        const response = await sendOtp(mobile);
        if (response.success) {
          setSuccessMessage(response.message || 'OTP sent successfully');
          setStep('otp');
        }
      } catch (error: any) {
        setErrorMessage(error.message || 'Failed to send OTP. Please try again.');
      } finally {
        setLoading(false);
      }
    },
    [mobile]
  );

  const handleVerifyOtp = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      // Validate OTP
      if (!otp || otp.length < 4) {
        setErrorMessage('Please enter a valid OTP');
        return;
      }

      setLoading(true);
      setErrorMessage('');

      try {
        const response = await verifyOtp(mobile, otp);
        if (response.success) {
          // Token and user data are already stored by verifyOtp
          console.log('OTP verified successfully, token stored');

          // Small delay to ensure storage completes
          await new Promise((resolve) => setTimeout(resolve, 100));

          // Navigate to dashboard
          router.push('/dashboard');
        }
      } catch (error: any) {
        setErrorMessage(error.message || 'Invalid OTP. Please try again.');
      } finally {
        setLoading(false);
      }
    },
    [mobile, otp, router]
  );

  const handleBackToMobile = useCallback(() => {
    setStep('mobile');
    setOtp('');
    setErrorMessage('');
    setSuccessMessage('');
  }, []);

  const renderMobileForm = (
    <Box
      component="form"
      onSubmit={handleSendOtp}
      sx={{
        display: 'flex',
        alignItems: 'stretch',
        flexDirection: 'column',
      }}
    >
      <TextField
        fullWidth
        name="mobile"
        label="Mobile Number"
        value={mobile}
        onChange={handleMobileChange}
        placeholder="Enter your mobile number"
        disabled={loading}
        sx={{ mb: 3 }}
        slotProps={{
          inputLabel: { shrink: true },
        }}
      />

      {errorMessage && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {errorMessage}
        </Alert>
      )}

      <Button
        fullWidth
        size="large"
        type="submit"
        color="inherit"
        variant="contained"
        disabled={loading}
      >
        {loading ? <CircularProgress size={24} /> : 'Send OTP'}
      </Button>
    </Box>
  );

  const renderOtpForm = (
    <Box
      component="form"
      onSubmit={handleVerifyOtp}
      sx={{
        display: 'flex',
        alignItems: 'stretch',
        flexDirection: 'column',
      }}
    >
      {successMessage && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {successMessage}
        </Alert>
      )}

      <TextField
        fullWidth
        name="otp"
        label="Enter OTP"
        value={otp}
        onChange={handleOtpChange}
        placeholder="Enter the OTP sent to your mobile"
        disabled={loading}
        sx={{ mb: 3 }}
        slotProps={{
          inputLabel: { shrink: true },
        }}
      />

      {errorMessage && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {errorMessage}
        </Alert>
      )}

      <Button
        fullWidth
        size="large"
        type="submit"
        color="inherit"
        variant="contained"
        disabled={loading}
        sx={{ mb: 2 }}
      >
        {loading ? <CircularProgress size={24} /> : 'Verify OTP'}
      </Button>

      <Button
        fullWidth
        size="large"
        color="inherit"
        variant="outlined"
        onClick={handleBackToMobile}
        disabled={loading}
      >
        Back to Mobile
      </Button>
    </Box>
  );

  return (
    <>
      <Box
        sx={{
          gap: 1.5,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          mb: 5,
        }}
      >
        <Typography variant="h5">Sign in</Typography>
        <Typography
          variant="body2"
          sx={{
            color: 'text.secondary',
          }}
        >
          {step === 'mobile'
            ? 'Enter your mobile number to receive an OTP'
            : `Enter the OTP sent to ${mobile}`}
        </Typography>
      </Box>
      {step === 'mobile' ? renderMobileForm : renderOtpForm}
    </>
  );
}
