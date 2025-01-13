'use client';

import React from 'react';
import { Button } from './ui/button';
import { signIn } from 'next-auth/react';

type Props = {
  text: string;
  callbackUrl?: string;
};

const SignInButton = ({ text, callbackUrl }: Props) => {
  return (
    <Button 
      onClick={() => {
        signIn('google', {
          callbackUrl: callbackUrl || '/dashboard'
        }).catch(console.error);
      }}
    >
      {text}
    </Button>
  );
};

export default SignInButton;