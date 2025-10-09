import React from 'react';
import { Spinner } from '@blueprintjs/core';
import styled from 'polotno/utils/styled';

const LoadingContainer = styled('div')`
  min-height: 100vh;
  background: #f5f5f5;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  font-family: 'Courier Prime', 'Courier New', monospace;
`;

const LogoText = styled('h1')`
  color: #000000;
  font-size: 32px;
  font-weight: 700;
  margin: 0 0 20px 0;
  letter-spacing: -0.5px;
`;

const LoadingText = styled('p')`
  color: #666666;
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