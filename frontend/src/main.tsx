import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Route, Routes } from 'react-router'
import './index.css'
import App from './App.tsx'
import SwimmerList from './SwimmerList.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* BrowserRouter watches the address bar; Routes renders the first
        Route whose path matches it. */}
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<SwimmerList />} />
        {/* :swimmerId matches any one segment, e.g. /swimmers/test-kate.
            App doesn't read it yet. */}
        <Route path="/swimmers/:swimmerId" element={<App />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
