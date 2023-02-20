import React from 'react';
import {convertObjectKeys} from './CaseConverters.js';

const wrapInAppContainer = (WrappedComponent) => {
  const WrappedInApp = (props) => {
    return <WrappedComponent {...props} />

  };

  WrappedInApp.displayName = WrappedInApp(WrappedComponent.name);

  return WrappedInApp;
};

export default wrapInAppContainer;
