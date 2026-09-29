'use client';
import React from 'react';
import logo from '../images/careerfastlogofinal.png';
import { getImageUrl } from '../utils/getImageUrl';
import '../css/CommonLoader.css';

export default function CommonLoader({
    fullScreen = true,
    text = 'Loading CareerFast',
    size = 'default',
    style = {}
}) {
    const logoSrc = getImageUrl(logo);

    const logoWidth = size === 'small' ? 140 : size === 'large' ? 220 : 180;
    const barWidth = size === 'small' ? 120 : size === 'large' ? 180 : 150;

    // Clean trailing dots if passed in text (e.g., "Loading CareerFast..." -> "Loading CareerFast")
    const cleanText = text ? text.replace(/\.+$/, '') : '';

    const wrapperInlineStyle = {
        position: fullScreen ? 'fixed' : 'relative',
        top: 0,
        left: 0,
        width: fullScreen ? '100vw' : '100%',
        height: fullScreen ? '100vh' : 'auto',
        minHeight: fullScreen ? '100vh' : '200px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: fullScreen ? 999999 : 10,
        background: fullScreen ? '#ffffff' : 'transparent',
        boxSizing: 'border-box',
        ...style
    };

    return (
        <div
            className={`common-loader-wrapper ${fullScreen ? 'fullscreen' : 'inline'}`}
            style={wrapperInlineStyle}
        >
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
                <div className="cf-progress-track" style={{ width: `${barWidth}px` }}>
                    <div className="cf-progress-indicator" />
                </div>

                {/* Subtle Text with Bouncing Dots */}
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
