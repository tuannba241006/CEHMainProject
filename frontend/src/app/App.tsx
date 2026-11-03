import { RouterProvider } from "react-router"
import { ToastProvider } from "../components/Toast"
import { AppProvider } from "../context/AppContext"
import { UserProvider } from "../context/UserContext"
import { router } from "./routes"

export default function App() {
  return (
    <UserProvider>
      <AppProvider>
        <ToastProvider>
          <RouterProvider router={router} />
        </ToastProvider>
      </AppProvider>
    </UserProvider>
  )
}
