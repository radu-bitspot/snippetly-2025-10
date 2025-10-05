import React, { useState } from 'react';
import { Button, InputGroup, Card, Callout, Intent } from '@blueprintjs/core';
import { useAuth } from '../../context/AuthContext';

const LoginForm = ({ onClose }) => {
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

    try {
      await login(formData.email, formData.password);
      onClose(); // Close the modal on successful login
    } catch (error) {
      setError(error.message || 'Login failed');
    }
  };

  return (
    <Card style={{ padding: '20px', minWidth: '400px' }}>
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <h2 style={{ margin: '0 0 10px 0', color: '#f5f8fa' }}>Welcome Back</h2>
        <p style={{ margin: 0, opacity: 0.7, fontSize: '14px' }}>
          Sign in to your account
        </p>
      </div>

      {error && (
        <Callout intent={Intent.DANGER} style={{ marginBottom: '15px' }}>
          {error}
        </Callout>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ 
            display: 'block', 
            marginBottom: '5px', 
            fontSize: '14px',
            fontWeight: '500'
          }}>
            Email
          </label>
          <InputGroup
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Enter your email"
            large
            leftIcon="envelope"
            disabled={isLoading}
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ 
            display: 'block', 
            marginBottom: '5px', 
            fontSize: '14px',
            fontWeight: '500'
          }}>
            Password
          </label>
          <InputGroup
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Enter your password"
            large
            leftIcon="lock"
            disabled={isLoading}
          />
        </div>

        <Button
          type="submit"
          intent="primary"
          large
          fill
          loading={isLoading}
          disabled={isLoading}
          style={{ marginBottom: '15px' }}
        >
          {isLoading ? 'Signing In...' : 'Sign In'}
        </Button>

        <div style={{ textAlign: 'center' }}>
          <Button
            minimal
            small
            onClick={() => {
              // TODO: Implement forgot password
              alert('Password reset feature coming soon!');
            }}
            style={{ 
              padding: 0, 
              minHeight: 'auto',
              fontSize: '12px',
              opacity: 0.6
            }}
            disabled={isLoading}
          >
            Forgot your password?
          </Button>
        </div>
      </form>
    </Card>
  );
};

export default LoginForm; 