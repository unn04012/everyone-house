import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App.js';
import './styles/app.css';
import './styles/layout.css';
import './styles/theme.css';

// 엔트리는 얇게. 부작용은 렌더 하나뿐이다.
const container = document.getElementById('root');
if (!container) {
  throw new Error('#root 를 찾을 수 없어요');
}
createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
