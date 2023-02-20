// create-react-app requirement
process.env.NODE_ENV = 'production';

require('@babel/register')({
    ignore: [ /(node_modules)/],
    presets: ["@babel/preset-env", '@babel/preset-react'],
});

require.extensions['.scss'] = () => {};
require.extensions['.css'] = () => {};
require('./src/hypernova');
