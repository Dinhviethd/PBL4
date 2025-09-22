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
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
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
  const { showSuccess, showError } = useNotification();

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
    <div className="flex min-h-screen">
      {/* Background section */}
      <div className="hidden lg:flex flex-1 items-center justify-center bg-gradient-to-br from-purple-500 to-pink-500">
        <div className="text-center text-white max-w-[640px] p-8">
          <h1 className="text-5xl font-bold mb-4">ChatMate</h1>
          <p className="text-xl mb-4">Kết nối mọi người, mọi lúc, mọi nơi</p>
          <p className="text-lg">
            Trò chuyện nhanh chóng, chia sẻ khoảnh khắc đáng nhớ và kết nối với bạn bè
            một cách dễ dàng nhất. ChatMate mang đến trải nghiệm nhắn tin hoàn toàn mới.
          </p>
        </div>
      </div>

      {/* Form section */}
      <div className="w-full max-w-[600px] flex items-center justify-center bg-gray-100">
        <div className="w-full max-w-[360px] bg-white rounded-2xl shadow-2xl p-10 m-4">
          <h1 className="text-2xl font-bold mb-2">Đăng nhập</h1>
          <p className="text-gray-600 mb-8">Chào mừng bạn quay trở lại ChatMate</p>

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-4"
            >
              {/* Email */}
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="Nhập email của bạn"
                        disabled={isLoading}
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
                    <FormLabel>Mật khẩu</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Nhập mật khẩu"
                        disabled={isLoading}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Remember + Forgot password */}
              <div className="flex items-center justify-between">
                <FormField
                  control={form.control}
                  name="remember"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-2">
                      <FormControl>
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-gray-300"
                          checked={field.value}
                          onChange={(e) => field.onChange(e.target.checked)}
                          disabled={isLoading}
                        />
                      </FormControl>
                      <FormLabel className="text-sm font-normal">
                        Ghi nhớ đăng nhập
                      </FormLabel>
                    </FormItem>
                  )}
                />
                <Link
                  to="/auth/forgot-password"
                  className="text-sm text-blue-600 hover:underline"
                >
                  Quên mật khẩu?
                </Link>
              </div>

              {/* Submit */}
              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700"
                disabled={isLoading}
              >
                {isLoading ? "Đang đăng nhập..." : "Đăng nhập"}
              </Button>

              {/* Register link */}
              <p className="text-center text-sm text-gray-600">
                Chưa có tài khoản?{" "}
                <Link
                  to="/auth/register"
                  className="text-blue-600 hover:underline"
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
