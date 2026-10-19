import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Route, Routes } from 'react-router'
import './index.css'
import NotFound from './NotFound.tsx'
import SwimmerList from './SwimmerList.tsx'
import SwimmerRoute from './SwimmerRoute.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* BrowserRouter watches the address bar; Routes renders the first
        Route whose path matches it. */}
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<SwimmerList />} />
        {/* :swimmerId matches any one segment, e.g. /swimmers/test-kate. */}
        <Route path="/swimmers/:swimmerId" element={<SwimmerRoute />} />
        {/* * matches anything the routes above didn't. */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
