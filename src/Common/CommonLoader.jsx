'use client';
import React from 'react';
import defaultLogo from '../images/careerfastlogofinal.png';
import { getImageUrl } from '../utils/getImageUrl';
import '../css/CommonLoader.css';

export default function CommonLoader({
  fullScreen = true,
  text = 'Loading CareerFast',
  size = 'default',
  logo = defaultLogo,
  backdropBlur = false,
  showProgress = true,
  showAmbient = true,
  style = {},
  className = '',
}) {
  const logoSrc = getImageUrl(logo || defaultLogo);

  // Responsive dynamic widths
  const logoWidth = size === 'small' ? 140 : size === 'large' ? 240 : 190;
  const barWidth = size === 'small' ? 120 : size === 'large' ? 190 : 150;

  // Clean trailing dots if passed in text (e.g., "Loading Superadmin Console..." -> "Loading Superadmin Console")
  const cleanText = text ? text.replace(/\.+$/, '') : '';

  const wrapperInlineStyle = {
    position: fullScreen ? 'fixed' : 'relative',
    top: 0,
    left: 0,
    width: fullScreen ? '100vw' : '100%',
    height: fullScreen ? '100vh' : 'auto',
    minHeight: fullScreen ? '100vh' : '220px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: fullScreen ? 999999 : 10,
    background: fullScreen
      ? backdropBlur
        ? 'rgba(255, 255, 255, 0.92)'
        : '#ffffff'
      : 'transparent',
    boxSizing: 'border-box',
    ...style,
  };

  return (
    <div
      className={`common-loader-wrapper ${fullScreen ? 'fullscreen' : 'inline'} ${
        backdropBlur ? 'backdrop-blur' : ''
      } ${className}`}
      style={wrapperInlineStyle}
    >
      {/* Aurora Ambient Lighting Effect */}
      {fullScreen && showAmbient && (
        <div className="cf-loader-ambient" aria-hidden="true">
          <div className="cf-loader-glow-1" />
          <div className="cf-loader-glow-2" />
        </div>
      )}

      <div className="common-loader-content">
        {/* Brand Logo Container */}
        <div className="cf-logo-box">
          <img
            src={logoSrc}
            alt="CareerFast"
            className="brand-logo-img"
            style={{ width: `${logoWidth}px` }}
          />
        </div>

        {/* Sleek Minimal Progress Line */}
        {showProgress && (
          <div className="cf-progress-track" style={{ width: `${barWidth}px` }}>
            <div className="cf-progress-indicator" />
          </div>
        )}

        {/* Subtle Text with Bouncing Brand Dots */}
        {cleanText && (
          <p className="loading-caption">
            <span>{cleanText}</span>
            <span className="loading-dots">
              <span className="loading-dot" />
              <span className="loading-dot" />
              <span className="loading-dot" />
            </span>
          </p>
        )}
      </div>
    </div>
  );
}
