
import MainLayout from "./layouts/MainLayout";
import AuthLayout from "./layouts/AuthLayout";
import HomePage from "./pages/publics/HomePage";
import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";
import ForgotPasswordPage from "./pages/auth/ForgotPasswordPage";

const routes = [
  {
    path: "/",
    Component: MainLayout,
    children: [
      { path: "", Component: HomePage },
    ],
  },
  {
    path: "auth",
    Component: AuthLayout,
    children: [
      { path: "login", Component: LoginPage },
      { path: "register", Component: RegisterPage },
      { path: "forgot-password", Component: ForgotPasswordPage },
    ],
  },
];

export default routes;