import React from 'react';
import { Spinner } from '@blueprintjs/core';
import styled from 'polotno/utils/styled';

const LoadingContainer = styled('div')`
  min-height: 100vh;
  background: linear-gradient(135deg, #1a1a1a 0%, #2d3748 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
`;

const LogoText = styled('h1')`
  color: #f5f8fa;
  font-size: 32px;
  font-weight: 700;
  margin: 0 0 20px 0;
  letter-spacing: -0.5px;
`;

const LoadingText = styled('p')`
  color: #8a9ba8;
  font-size: 16px;
  margin: 20px 0 0 0;
  font-weight: 400;
`;

const LoadingScreen = () => {
  return (
    <LoadingContainer>
      <LogoText>Polotno Studio</LogoText>
      <Spinner size={40} />
      <LoadingText>Loading...</LoadingText>
    </LoadingContainer>
  );
};

export default LoadingScreen; 