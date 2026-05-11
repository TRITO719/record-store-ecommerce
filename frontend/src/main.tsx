import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { store } from './store';
import { saveCartToStorage } from './store/cartSlice';
import { ThemeProvider } from './context/ThemeContext';
import App from './App';
import './index.css';

store.subscribe(() => {
  saveCartToStorage(store.getState().cart);
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Provider store={store}>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </Provider>
  </React.StrictMode>
);