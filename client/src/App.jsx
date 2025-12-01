import { Outlet } from "react-router-dom"
import { NotificationProvider } from "@/contexts/NotificationContext"

const App= () =>(
    <NotificationProvider>
      <div className="">
        <Outlet/>
      </div>
    </NotificationProvider>
)
export default App