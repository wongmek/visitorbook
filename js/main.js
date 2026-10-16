import { clear } from './model.js';
import { home } from './home.js';

const app = document.getElementById('app');
export { app, clear };

// Start the application by showing the home view
home();