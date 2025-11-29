import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import Button from "@/components/ui/button";
import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import authService from "@/services/auth.service";
import { useNotification } from "@/hooks/useNotification";

// Validate schema
const formSchema = z.object({
  email: z.string().email({ message: "Email không hợp lệ" }),
  password: z.string().min(6, { message: "Mật khẩu phải chứa ít nhất 6 kí tự." }),
  remember: z.boolean().optional().default(false),
});

const Login = () => {
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
      remember: false,
    },
  });

  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { showSuccess, showError, showInfo } = useNotification();

  // Show message from navigation state
  useEffect(() => {
    if (location.state?.message) {
      const { message, type = 'success' } = location.state;
      
      if (type === 'success') {
        showSuccess("Thành công", message);
      } else if (type === 'info') {
        showInfo("Thông báo", message);
      } else if (type === 'error') {
        showError("Lỗi", message);
      }
      
      // Clear the state to prevent showing the message again
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, showSuccess, showError, showInfo, navigate, location.pathname]);

  const onSubmit = async (data) => {
    try {
      setIsLoading(true);
      await authService.login(data.email, data.password, data.remember);
      
      showSuccess("Đăng nhập thành công", "Chào mừng bạn đã quay trở lại ChatMate!");
      navigate("/"); // sau khi login thành công
    } catch (err) {
      console.error("Login error:", err);
      
      // Xử lý các loại lỗi khác nhau
      let errorMessage = "Đăng nhập thất bại. Vui lòng thử lại.";
      
      if (err.response?.status === 401) {
        errorMessage = "Email hoặc mật khẩu không chính xác.";
      } else if (err.response?.status === 403) {
        errorMessage = "Tài khoản của bạn đã bị khóa.";
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      showError("Đăng nhập thất bại", errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-blue-100 relative overflow-hidden">
      {/* Floating background elements - More visible */}
      <div className="absolute -top-10 -left-10 w-96 h-96 bg-blue-300 rounded-full blur-2xl opacity-60 animate-float" style={{animation: 'float 8s infinite ease-in-out'}}></div>
      <div className="absolute -bottom-20 -right-20 w-96 h-96 bg-cyan-300 rounded-full blur-2xl opacity-50 animate-float-reverse" style={{animation: 'float-reverse 8s infinite ease-in-out'}}></div>
      <div className="absolute top-32 right-1/4 w-72 h-72 bg-blue-200 rounded-full blur-2xl opacity-60 animate-float" style={{animation: 'float 10s infinite ease-in-out'}}></div>

      {/* Background section */}
      <div className="hidden lg:flex flex-1 items-center justify-center relative z-10">
        <div className="text-center text-blue-900 max-w-[640px] p-8">
          <h1 className="text-6xl font-extrabold mb-6 text-blue-700">ChatMate</h1>
          <p className="text-2xl mb-6 text-blue-600 font-semibold">Kết nối mọi người, mọi lúc, mọi nơi</p>
          <p className="text-lg text-blue-500 leading-relaxed">
            Trò chuyện nhanh chóng, chia sẻ khoảnh khắc đáng nhớ và kết nối với bạn bè
            một cách dễ dàng nhất. ChatMate mang đến trải nghiệm nhắn tin hoàn toàn mới.
          </p>
        </div>
      </div>

      {/* Form section */}
      <div className="w-full max-w-[600px] flex items-center justify-center relative z-20">
        <div className="w-full max-w-[420px] bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl p-10 m-4 border border-blue-100 animate-fade-in">
          <h1 className="text-4xl font-bold mb-3 text-center text-blue-700">Đăng nhập</h1>
          <p className="text-center text-blue-500 mb-8">Chào mừng bạn quay trở lại ChatMate</p>

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-6"
            >
              {/* Email */}
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-blue-700 font-semibold">Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="Nhập email của bạn"
                        disabled={isLoading}
                        className="border-blue-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-300 rounded-lg bg-blue-50/50"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Password */}
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-blue-700 font-semibold">Mật khẩu</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Nhập mật khẩu"
                        disabled={isLoading}
                        className="border-blue-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-300 rounded-lg bg-blue-50/50"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Remember + Forgot password */}
              <div className="flex items-center justify-between pt-2">
                <FormField
                  control={form.control}
                  name="remember"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-2">
                      <FormControl>
                        <input
                          type="checkbox"
                          className="h-5 w-5 rounded border-blue-300 accent-blue-500 focus:ring-2 focus:ring-blue-400"
                          checked={field.value}
                          onChange={(e) => field.onChange(e.target.checked)}
                          disabled={isLoading}
                        />
                      </FormControl>
                      <FormLabel className="text-sm font-normal text-gray-600">
                        Ghi nhớ đăng nhập
                      </FormLabel>
                    </FormItem>
                  )}
                />
                <Link
                  to="/auth/forgot-password"
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
                >
                  Quên mật khẩu?
                </Link>
              </div>

              {/* Submit */}
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-bold py-3 rounded-lg shadow-lg hover:shadow-xl transition-all transform hover:scale-105 duration-200"
                disabled={isLoading}
              >
                {isLoading ? "Đang đăng nhập..." : "Đăng nhập"}
              </Button>

              {/* Register link */}
              <p className="text-center text-sm text-gray-600 pt-2">
                Chưa có tài khoản?{" "}
                <Link
                  to="/auth/register"
                  className="text-blue-600 hover:text-blue-700 font-semibold transition-colors"
                >
                  Đăng ký ngay
                </Link>
              </p>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
};

export default Login;
