import AppRoutes from './routes/AppRoutes'
import Navbar from './components/Navbar'
import ToastContainer from './components/Toast'

function App() {
  return (
    <>
      <Navbar />
      <AppRoutes />
      <ToastContainer />
    </>
  )
}

export default App
