import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import FormInput from "@/components/forms/formInput"
import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import authService from "@/services/auth.service"
//định nghĩa validate cho form
const formSchema = z.object({
  email: z.string().email({ message: "Email không hợp lệ" }),
  password: z.string().min(6, { message: "Mật khẩu phải chứa ít nhất 6 kí tự." }),
  remember: z.boolean().optional().default(false)
})
const Login = () => {
  // Form validation với react-hook-form
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
      remember: false
    }
  })

  // Hàm xử lý khi submit form
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  
  const onSubmit = async (data) => {
    try {
      setIsLoading(true);
      setError("");
      const result = await authService.login(data.email, data.password, data.remember);
      // TODO: Handle successful login (redirect to dashboard)
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Đăng nhập thất bại');
    } finally {
      setIsLoading(false);
    }
  }
  const [variant, setVariant] = useState("SIGNIN")
  const toggleVariant= () => {
    if (variant === 'SIGNIN') setVariant("SIGNUP")
      else setVariant("SIGNIN")
  }
  // Google login sẽ được thêm sau
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
          <h1 className="text-2xl font-bold mb-2">Đăng nhập</h1>
          <p className="text-gray-600 mb-8">Chào mừng bạn quay trở lại ChatMate</p>

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
                    <FormLabel>Mật khẩu</FormLabel>
                    <FormControl>
                      <Input 
                        type="password" 
                        placeholder="Nhập mật khẩu"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

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
                          {...field}
                        />
                      </FormControl>
                      <FormLabel className="text-sm font-normal">
                        Ghi nhớ đăng nhập
                      </FormLabel>
                    </FormItem>
                  )}
                />
                <Link to="/auth/forgot-password" className="text-sm text-blue-600 hover:underline">
                  Quên mật khẩu?
                </Link>
              </div>

              {error && (
                <div className="text-sm text-red-500 mb-4">
                  {error}
                </div>
              )}

              <Button 
                type="submit" 
                className="w-full bg-blue-600 hover:bg-blue-700"
                disabled={isLoading}
              >
                {isLoading ? "Đang đăng nhập..." : "Đăng nhập"}
              </Button>

              <p className="text-center text-sm text-gray-600">
                Chưa có tài khoản?{" "}
                <Link to="/auth/register" className="text-blue-600 hover:underline">
                  Đăng ký ngay
                </Link>
              </p>
            </form>
          </Form>
        </div>
      </div>
    </div>
  )
}

export default Login