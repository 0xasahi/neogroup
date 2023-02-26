import hypernova from 'hypernova/server';
import { renderReact } from 'hypernova-react';
import express from 'express';
import * as App from './App';

require = require('esm')(module);

let config = {
  devMode: process.env.NODE_ENV !== 'production',
  port: 3030,
  getComponent(name, _context) {
    if (name.indexOf('C.') !== 0) {
      return null;
    }

    try {
      const componentName = name.split('.').slice(-1)[0];
      const Containers = App.default;
      const Component = Containers[componentName];
      return renderReact(componentName, Component);
    } catch (e) {
      console.error(e);

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
