import React from 'react';
import { Dialog, Classes } from '@blueprintjs/core';
import LoginForm from './LoginForm';

const AuthModal = ({ isOpen, onClose }) => {
  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title=""
      className={Classes.DARK}
      style={{
        background: 'transparent',
        paddingBottom: 0
      }}
      canEscapeKeyClose={true}
      canOutsideClickClose={true}
    >
      <div className={Classes.DIALOG_BODY} style={{ padding: 0 }}>
        <LoginForm 
          onClose={onClose}
        />
      </div>
    </Dialog>
  );
};

export default AuthModal; 