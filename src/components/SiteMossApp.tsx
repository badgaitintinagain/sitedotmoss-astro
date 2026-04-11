"use client";
import React from 'react';
import { ThemeProvider } from '@/components/ThemeProvider';
import Background from '@/components/Background';
import HomePage from './HomePage';

export default function SiteMossApp() {
  return (
    <ThemeProvider>
      <Background />
      <HomePage />
    </ThemeProvider>
  );
}
