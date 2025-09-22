import { Outlet } from "react-router-dom"
import { NotificationProvider } from "@/contexts/NotificationContext"
import { ThemeProvider } from "@/contexts/ThemeContext"

const App= () =>(
  <ThemeProvider>
    <NotificationProvider>
      <div className="">
        <Outlet/>
      </div>
    </NotificationProvider>
  </ThemeProvider>
)
export default App