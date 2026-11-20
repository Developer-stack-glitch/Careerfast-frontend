'use client';
import React from 'react';
import '../css/CommonLoader.css';

export default function CommonLoader({
  fullScreen = true,
  text = '',
  size = 'default',
  logo = null,
  backdropBlur = false,
  showProgress = true,
  showAmbient = false,
  style = {},
  className = '',
}) {
  if (fullScreen) {
    return (
      <div className={`top-nav-loader-bar ${className}`} aria-hidden="true" style={style}>
        <div className="top-nav-loader-progress" />
      </div>
    );
  }

  const cleanText = text ? text.replace(/\.+$/, '') : '';

  return (
    <div className={`common-loader-inline ${className}`} style={style}>
      <div className="cf-inline-spinner" />
      {cleanText && <span className="cf-inline-text">{cleanText}</span>}
    </div>
  );
}
