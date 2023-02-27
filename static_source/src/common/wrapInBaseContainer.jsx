import React from 'react';

const wrapInAppContainer = (WrappedComponent) => {
  const WrappedInApp = (props) => {
    return <WrappedComponent {...props} />

  };

  WrappedInApp.displayName = WrappedInApp(WrappedComponent.name);

  return WrappedInApp;
};

export default wrapInAppContainer;
