import { BrowserRouter, Routes, Route } from 'react-router-dom'
import UploadPage from './pages/UploadPage.jsx'
import PaymentPage from './pages/PaymentPage.jsx'
import ConfirmPage from './pages/ConfirmPage.jsx'
import AdminPage from './pages/AdminPage.jsx'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<UploadPage />} />
        <Route path="/upload" element={<UploadPage />} />
        <Route path="/payment" element={<PaymentPage />} />
        <Route path="/confirm" element={<ConfirmPage />} />
        <Route path="/admin-portal" element={<AdminPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
