import { RouterProvider } from "react-router"
import { StepUpConfirmDialog } from "../components/security/StepUpConfirmDialog"
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
          <StepUpConfirmDialog />
        </ToastProvider>
      </AppProvider>
    </UserProvider>
  )
}
