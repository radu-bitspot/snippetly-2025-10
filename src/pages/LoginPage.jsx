import React, { useState } from 'react';
import { Button, InputGroup, Card, Callout, Intent, Spinner } from '@blueprintjs/core';
import { useAuth } from '../context/AuthContext';
import styled from 'polotno/utils/styled';

const LoginContainer = styled('div')`
  min-height: 100vh;
  background: #f5f5f5;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  font-family: 'Courier Prime', 'Courier New', monospace;
`;

const LoginCard = styled(Card)`
  padding: 40px;
  max-width: 420px;
  width: 100%;
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
  border: 2px solid #000000;
`;

const Logo = styled('div')`
  text-align: center;
  margin-bottom: 40px;
`;

const LogoText = styled('h1')`
  color: #ffffff;
  font-size: 32px;
  font-weight: 700;
  margin: 0 0 8px 0;
  letter-spacing: -0.5px;
`;

const LogoSubtext = styled('p')`
  color: #999999;
  font-size: 16px;
  margin: 0;
  font-weight: 400;
`;

const FormGroup = styled('div')`
  margin-bottom: 20px;
`;

const Label = styled('label')`
  display: block;
  margin-bottom: 8px;
  font-size: 14px;
  font-weight: 500;
  color: #ffffff;
`;

const StyledInputGroup = styled(InputGroup)`
  .bp5-input {
    background: #ffffff;
    border: 2px solid #cccccc;
    color: #000000;
    font-size: 16px;
    padding: 12px 16px;
    border-radius: 8px;

    &:focus {
      border-color: #000000;
      box-shadow: 0 0 0 3px rgba(0, 0, 0, 0.1);
    }

    &::placeholder {
      color: #999999;
    }
  }

  .bp5-icon {
    color: #666666;
  }
`;

const LoginButton = styled(Button)`
  margin-top: 24px;
  padding: 12px 24px;
  font-size: 16px;
  font-weight: 600;
  border-radius: 8px;
  transition: all 0.2s ease;
  background: #000000 !important;
  color: #ffffff !important;

  &:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
    background: #2a2a2a !important;
  }
`;

const ForgotPassword = styled(Button)`
  margin-top: 16px;
  color: #999999;
  font-size: 14px;

  &:hover {
    color: #ffffff;
  }
`;

const LoadingOverlay = styled('div')`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
`;

const LoginPage = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const { login, isLoading } = useAuth();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError(''); // Clear error when user types
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.email || !formData.password) {
      setError('Please fill in all fields');
      return;
    }

    if (!formData.email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    try {
      await login(formData.email, formData.password);
      // Navigation will happen automatically via AuthContext
    } catch (error) {
      setError(error.message || 'Login failed. Please check your credentials.');
    }
  };

  return (
    <LoginContainer>
      <LoginCard>
        {isLoading && (
          <LoadingOverlay>
            <Spinner size={40} />
          </LoadingOverlay>
        )}
        
        <Logo>
          <LogoText>Snippetly Studio</LogoText>
          <LogoSubtext>Professional Design Editor</LogoSubtext>
        </Logo>

        {error && (
          <Callout 
            intent={Intent.DANGER} 
            style={{ marginBottom: '24px' }}
          >
            {error}
          </Callout>
        )}

        <form onSubmit={handleSubmit}>
          <FormGroup>
            <Label>Email Address</Label>
            <StyledInputGroup
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email"
              large
              leftIcon="envelope"
              disabled={isLoading}
            />
          </FormGroup>

          <FormGroup>
            <Label>Password</Label>
            <StyledInputGroup
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter your password"
              large
              leftIcon="lock"
              disabled={isLoading}
            />
          </FormGroup>

          <LoginButton
            type="submit"
            intent="primary"
            large
            fill
            loading={isLoading}
            disabled={isLoading || !formData.email || !formData.password}
          >
            {isLoading ? 'Signing In...' : 'Sign In to Studio'}
          </LoginButton>

          <div style={{ textAlign: 'center' }}>
            <ForgotPassword
              minimal
              onClick={() => {
                alert('Password reset feature coming soon!');
              }}
              disabled={isLoading}
            >
              Forgot your password?
            </ForgotPassword>
          </div>
        </form>

        <div style={{
          textAlign: 'center',
          marginTop: '32px',
          paddingTop: '24px',
          borderTop: '1px solid #555555',
          color: '#999999',
          fontSize: '14px'
        }}>
          Secure login powered by your Django backend
        </div>
      </LoginCard>
    </LoginContainer>
  );
};

export default LoginPage; 