import React from 'react';
import ReactDOM from 'react-dom/client';
import '@fontsource-variable/dm-sans';
import App from './App';
import { SiteEntry } from './SiteEntry';
import './styles.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode><SiteEntry><App /></SiteEntry></React.StrictMode>,
);
