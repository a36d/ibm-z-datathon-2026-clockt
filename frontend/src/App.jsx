import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout.jsx'
import { ClocktProvider } from './contexts/ClocktContext.jsx'
import Account from './pages/Account.jsx'
import ActivityInput from './pages/ActivityInput.jsx'
import Analytics from './pages/Analytics.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Recommendations from './pages/Recommendations.jsx'
import Settings from './pages/Settings.jsx'

function App() {
  return (
    <ClocktProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/activities" element={<ActivityInput />} />
            <Route path="/recommendations" element={<Recommendations />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/account" element={<Account />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ClocktProvider>
  )
}

export default App
