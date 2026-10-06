import '@fontsource-variable/anybody/wdth.css'
import '@fontsource-variable/brygada-1918/index.css'
import '@fontsource-variable/brygada-1918/wght-italic.css'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './styles.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
