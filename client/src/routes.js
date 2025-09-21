
import App from "./App";
import MainLayout from "./layouts/MainLayout";
import AuthLayout from "./layouts/AuthLayout";
import HomePage from "./pages/publics/HomePage";
import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";
import ForgotPasswordPage from "./pages/auth/ForgotPasswordPage";
import SettingsPage from "./pages/settings/SettingsPage";
import ContactPage from "./pages/contact/ContactPage";

const routes = [
  {
    path: "/",
    Component: App,
    children: [
      {
        path: "/",
        Component: MainLayout,
        children: [
          { path: "", Component: HomePage },
          { path: "contact", Component: ContactPage },
          { path: "settings", Component: SettingsPage },
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
    ],
  },
];

export default routes;