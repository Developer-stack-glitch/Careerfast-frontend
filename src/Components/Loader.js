'use client';
import React from 'react';
import CommonLoader from '../Common/CommonLoader';

const Loader = ({ fullScreen = false, text = 'Loading...' }) => {
  return <CommonLoader fullScreen={fullScreen} text={text} />;
};

export default Loader;
