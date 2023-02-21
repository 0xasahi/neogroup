const hypernova = require('hypernova/server');
const renderReact = require('hypernova-react').renderReact;
const express = require('express');

require = require('esm')(module);

let config = {
  devMode: process.env.NODE_ENV !== 'production',
  port: 3030,
  host: '0.0.0.0',
  getComponent(name, _context) {
    if (name.indexOf('C.') !== 0) {
      return null;
    }

    try {
      const componentName = name.split('.').slice(-1)[0];
      const Containers = require('./App');
      const Component = Containers[componentName];
      return renderReact(componentName, Component);
    } catch (e) {
      return null;
    }
  },
  createApplication() {
    const app = express();
    // cors
    app.use(function (req, res, next) {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
      next();
    });
    return app;
  },
};

hypernova(config);
