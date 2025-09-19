import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import Button from "@/components/ui/button"
import { Link, useNavigate } from "react-router-dom"
import { useState } from "react"
import authService from "@/services/auth.service"

const formSchema = z.object({
  email: z.string().email({ message: "Email không hợp lệ" }),
  password: z.string().min(6, { message: "Mật khẩu phải chứa ít nhất 6 kí tự" }),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Mật khẩu xác nhận không khớp",
  path: ["confirmPassword"],
});

const ForgotPassword = () => {
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: ""
    }
  })

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState("request"); // "request" or "reset"
  const navigate = useNavigate();

  const onSubmit = async (data) => {
    try {
      setIsLoading(true);
      setError("");
      
      if (step === "request") {
        await authService.forgotPassword(data.email);
        setStep("reset");
      } else {
        await authService.resetPassword(data.email, data.password);
        navigate('/auth/login', { 
          state: { message: 'Mật khẩu đã được thay đổi thành công! Vui lòng đăng nhập.' }
        });
      }
    } catch (err) {
      setError(err.message || 'Yêu cầu thất bại');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen">
      {/* Background section */}
      <div className="hidden lg:flex flex-1 items-center justify-center bg-gradient-to-br from-purple-500 to-pink-500">
        <div className="text-center text-white max-w-[640px] p-8">
          <h1 className="text-5xl font-bold mb-4">ChatMate</h1>
          <p className="text-xl mb-4">Kết nối mọi người, mọi lúc, mọi nơi</p>
          <p className="text-lg">
            Trò chuyện nhanh chóng, chia sẻ khoảnh khắc đáng nhớ và kết nối với bạn bè một cách dễ dàng nhất.
            ChatMate mang đến trải nghiệm nhắn tin hoàn toàn mới.
          </p>
        </div>
      </div>
      
      {/* Form section */}
      <div className="w-full max-w-[600px] flex items-center justify-center bg-gray-100">
        <div className="w-full max-w-[360px] bg-white rounded-2xl shadow-2xl p-10 m-4">
          <h1 className="text-2xl font-bold mb-2">Thay đổi mật khẩu</h1>
          <p className="text-gray-600 mb-8">Khôi phục tài khoản của bạn</p>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mật khẩu mới</FormLabel>
                    <FormControl>
                      <Input 
                        type="password" 
                        placeholder="••••••••••"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Xác nhận mật khẩu</FormLabel>
                    <FormControl>
                      <Input 
                        type="password" 
                        placeholder="••••••••••"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {error && <div className="text-sm text-red-500 mb-4">{error}</div>}

              <Button 
                type="submit" 
                className="w-full bg-blue-600 hover:bg-blue-700"
                disabled={isLoading}
              >
                {isLoading ? "Đang xử lý..." : (step === "request" ? "Gửi yêu cầu" : "Đổi mật khẩu")}
              </Button>

              <div className="flex justify-center space-x-4 text-sm text-gray-600">
                <Link to="/auth/login" className="text-blue-600 hover:underline">
                  Đăng nhập
                </Link>
                <span>|</span>
                <Link to="/auth/register" className="text-blue-600 hover:underline">
                  Đăng ký
                </Link>
              </div>
            </form>
          </Form>
        </div>
      </div>
    </div>
  )
}

export default ForgotPassword