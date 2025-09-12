import pathname from "@/lib/pathName"
import App from "./App"
import { PublicLayout, RentProperty, SoldProperty, News, Home } from "./pages/publics/index"

const routes= [{
    path: "/",
    Component: App,
    children: [
        {
        path: pathname.public.layout, Component: PublicLayout,
            children: [
                {path: pathname.public.homepage, Component: Home},
            ]
        }
    ],

}]
export default routes