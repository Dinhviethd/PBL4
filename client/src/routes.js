import App from "./App"
import LoginPage from "./pages/auth/LoginPage"
import RegisterPage from "./pages/auth/RegisterPage"
import ForgotPasswordPage from "./pages/auth/ForgotPasswordPage"

const routes = [{
    path: "/",
    Component: App,
    children: [
        {
            path: "auth/login",
            Component: LoginPage
        },
        {
            path: "auth/register",
            Component: RegisterPage
        },
        {
            path: "auth/forgot-password",
            Component: ForgotPasswordPage
        }
    ],
}]
export default routes   