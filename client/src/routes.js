
import App from "./App";
import MainLayout from "./layouts/MainLayout";
import AuthLayout from "./layouts/AuthLayout";
import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";
import ForgotPasswordPage from "./pages/auth/ForgotPasswordPage";
import ConfirmPasswordResetPage from "./pages/auth/ConfirmPasswordResetPage";
import PasswordResetRedirectPage from "./pages/auth/PasswordResetRedirectPage";
import SettingsPage from "./pages/settings/SettingsPage";
import ConfirmChangePasswordPage from "./pages/settings/ConfirmChangePasswordPage";
import PasswordChangeRedirectPage from "./pages/settings/PasswordChangeRedirectPage";
import ContactPage from "./pages/contact/ContactPage";
import AddFriendPage from "./pages/contact/AddFriendPage";
import NotificationPage from "./pages/publics/NotificationPage";
import ChatPage from '@/pages/chat/ChatPage'
import CallPage from "@/pages/chat/CallPage"
const routes = [
  {
    path: "/",
    Component: App,
    children: [
      {
        path: "/",
        Component: MainLayout,
        children: [
          { path: "", Component: ChatPage },
          { path: "contact", Component: ContactPage },
          { path: "add-friend", Component: AddFriendPage },
          { path: "settings", Component: SettingsPage },
          { path: "confirm-password-change", Component: ConfirmChangePasswordPage },
          { path: "password-change-redirect", Component: PasswordChangeRedirectPage },
          { path: "notifications", Component: NotificationPage},
          { path: "call", Component: CallPage },
        ],
      },
      {
        path: "auth",
        Component: AuthLayout,
        children: [
          { path: "login", Component: LoginPage },
          { path: "register", Component: RegisterPage },
          { path: "forgot-password", Component: ForgotPasswordPage },
          { path: "password-reset-redirect", Component: PasswordResetRedirectPage },
          { path: "confirm-password-reset", Component: ConfirmPasswordResetPage },
        ],
      },
    ],
  },
];

export default routes;