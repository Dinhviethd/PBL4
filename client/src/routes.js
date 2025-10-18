
import App from "./App";
import MainLayout from "./layouts/MainLayout";
import AuthLayout from "./layouts/AuthLayout";
import HomePage from "./pages/publics/HomePage";
import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";
import ForgotPasswordPage from "./pages/auth/ForgotPasswordPage";
import ConfirmPasswordResetPage from "./pages/auth/ConfirmPasswordResetPage";
import SettingsPage from "./pages/settings/SettingsPage";
import ContactPage from "./pages/contact/ContactPage";
import AddFriendPage from "./pages/contact/AddFriendPage";
import NotificationPage from "./pages/publics/NotificationPage";

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
          { path: "add-friend", Component: AddFriendPage },
          { path: "settings", Component: SettingsPage },
          { path: "notifications", Component: NotificationPage},
        ],
      },
      {
        path: "auth",
        Component: AuthLayout,
        children: [
          { path: "login", Component: LoginPage },
          { path: "register", Component: RegisterPage },
          { path: "forgot-password", Component: ForgotPasswordPage },
          { path: "confirm-password-reset", Component: ConfirmPasswordResetPage },
        ],
      },
    ],
  },
];

export default routes;