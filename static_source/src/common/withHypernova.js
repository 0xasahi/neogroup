import { renderReact } from 'hypernova-react';

const withHypernova = (displayName) => (Component) => {
  return renderReact(displayName, Component);
};

export default withHypernova;
