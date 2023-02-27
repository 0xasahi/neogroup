import { useState, useEffect } from 'react';

export const useIsServer = () => {
  const [isServer, setIsServer] = useState(true);
  useEffect(() => {
    setIsServer(false);
  }, []);
  return isServer;
};

function ServerOnly ({ children = null, onClient = null}) {
  const isServer = useIsServer()
  return isServer
    ? children
    : onClient
}

export default ServerOnly;
