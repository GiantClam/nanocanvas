
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { NanoCanvasProps } from './types';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

// Default Configuration for Standalone execution
const defaultProps: NanoCanvasProps = {
  config: {
    provider: 'google',
    apiKey: "AIzaSyDEskyGfoYxEqC1QRA4H1vodqjMOFrmCQY" // Default key for demo/standalone
  },
  onBillingEvent: (event) => {
    console.log("[Billing Callback]:", event);
  }
};

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App {...defaultProps} />
  </React.StrictMode>
);