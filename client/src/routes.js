import React from "react";
import App from "./App";
import MainLayout from "./layouts/MainLayout";
import AuthLayout from "./layouts/AuthLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";
import ForgotPasswordPage from "./pages/auth/ForgotPasswordPage";
import ConfirmPasswordResetPage from "./pages/auth/ConfirmPasswordResetPage";
import PasswordResetRedirectPage from "./pages/auth/PasswordResetRedirectPage";
import CompleteProfilePage from "./pages/auth/CompleteProfilePage";
import SettingsPage from "./pages/settings/SettingsPage";
import ConfirmChangePasswordPage from "./pages/settings/ConfirmChangePasswordPage";
import PasswordChangeRedirectPage from "./pages/settings/PasswordChangeRedirectPage";
import ContactPage from "./pages/contact/ContactPage";
import AddFriendPage from "./pages/contact/AddFriendPage";
import NotificationPage from "./pages/publics/NotificationPage";
import ChatPage from '@/pages/chat/ChatPage'
import CallPage from "@/pages/chat/CallPage"

// Wrapper components for protected routes
const ProtectedChatPage = () => React.createElement(ProtectedRoute, {}, React.createElement(ChatPage));
const ProtectedContactPage = () => React.createElement(ProtectedRoute, {}, React.createElement(ContactPage));
const ProtectedAddFriendPage = () => React.createElement(ProtectedRoute, {}, React.createElement(AddFriendPage));
const ProtectedSettingsPage = () => React.createElement(ProtectedRoute, {}, React.createElement(SettingsPage));
const ProtectedConfirmChangePasswordPage = () => React.createElement(ProtectedRoute, {}, React.createElement(ConfirmChangePasswordPage));
const ProtectedPasswordChangeRedirectPage = () => React.createElement(ProtectedRoute, {}, React.createElement(PasswordChangeRedirectPage));
const ProtectedNotificationPage = () => React.createElement(ProtectedRoute, {}, React.createElement(NotificationPage));
const ProtectedCallPage = () => React.createElement(ProtectedRoute, {}, React.createElement(CallPage));
const routes = [
  {
    path: "/",
    Component: App,
    children: [
      {
        path: "/",
        Component: MainLayout,
        children: [
          { path: "", Component: ProtectedChatPage },
          { path: "contact", Component: ProtectedContactPage },
          { path: "add-friend", Component: ProtectedAddFriendPage },
          { path: "settings", Component: ProtectedSettingsPage },
          { path: "confirm-password-change", Component: ProtectedConfirmChangePasswordPage },
          { path: "password-change-redirect", Component: ProtectedPasswordChangeRedirectPage },
          { path: "notifications", Component: ProtectedNotificationPage},
          { path: "call", Component: ProtectedCallPage },
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
          { path: "complete-profile", Component: CompleteProfilePage },
        ],
      },
    ],
  },
];

export default routes;