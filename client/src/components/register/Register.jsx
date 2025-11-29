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
import authService from "@/services/auth.service"
import userService from "@/services/user.service"
import { useNotification } from "@/hooks/useNotification"
import { useState } from "react"

const formSchema = z.object({
  name: z.string().min(2, { message: "Họ và tên phải chứa ít nhất 2 kí tự." }),
  phone: z.string().refine(
    (value) => !value || /^[0-9]{10,11}$/.test(value),
    { message: "Số điện thoại không hợp lệ (10-11 chữ số)" }
  ).optional().or(z.literal("")),
  email: z.string().email({ message: "Email không hợp lệ" }),
  password: z.string().min(6, { message: "Mật khẩu phải chứa ít nhất 6 kí tự" }),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Mật khẩu xác nhận không khớp",
  path: ["confirmPassword"],
});

const Register = () => {
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      phone: "",
      email: "",
      password: "",
      confirmPassword: ""
    }
  })

  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { showSuccess, showError } = useNotification();

  const onSubmit = async (data) => {
    try {
      setIsLoading(true);
      
      // Check if phone already exists (nếu có nhập số điện thoại)
      if (data.phone && data.phone.trim()) {
        const existingPhoneUser = await userService.lookup({ phone: data.phone });
        if (existingPhoneUser) {
          showError("Lỗi đăng ký", "Số điện thoại đã được sử dụng");
          setIsLoading(false);
          return;
        }
      }
      
      await authService.register({
        name: data.name,
        phone: data.phone && data.phone.trim() ? data.phone : undefined,
        email: data.email,
        password: data.password,
        confirmPassword: data.confirmPassword
      });
      // Chuyển hướng đến trang đăng nhập sau khi đăng ký thành công
      showSuccess("Đăng ký thành công", "Vui lòng đăng nhập với tài khoản của bạn!");
      navigate('/auth/login', { 
        state: { message: 'Đăng ký thành công! Vui lòng đăng nhập.' }
      });
    } catch (err) {
      let errorMessage = "Đăng ký thất bại. Vui lòng thử lại.";
      
      // Lấy message lỗi từ response
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.response?.data?.errors && Array.isArray(err.response.data.errors)) {
        // Xử lý validation errors từ backend
        const firstError = err.response.data.errors[0];
        if (firstError?.message) {
          errorMessage = firstError.message;
        }
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      // Hiển thị lỗi cụ thể
      showError("Lỗi đăng ký", errorMessage);
      console.error("Register error:", err);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-blue-100 relative overflow-hidden">
      {/* Floating background elements - More visible */}
      <div className="absolute -top-10 -left-10 w-96 h-96 bg-blue-300 rounded-full blur-2xl opacity-60 animate-float" style={{animation: 'float 8s infinite ease-in-out'}}></div>
      <div className="absolute -bottom-20 -right-20 w-96 h-96 bg-cyan-300 rounded-full blur-2xl opacity-50 animate-float-reverse" style={{animation: 'float-reverse 8s infinite ease-in-out'}}></div>
      <div className="absolute top-32 right-1/4 w-72 h-72 bg-blue-200 rounded-full blur-2xl opacity-60 animate-float" style={{animation: 'float 10s infinite ease-in-out'}}></div>

      {/* Background section */}
      <div className="hidden lg:flex flex-1 items-center justify-center relative z-10">
        <div className="text-center text-blue-900 max-w-[640px] p-8">
          <h1 className="text-6xl font-extrabold mb-6 text-blue-700">Gia nhập ChatMate</h1>
          <p className="text-2xl mb-6 text-blue-600 font-semibold">Hành trình kết nối bắt đầu từ đây</p>
          <p className="text-lg text-blue-500 leading-relaxed">
            Tạo tài khoản của bạn và khám phá một thế giới giao tiếp mới. Kết nối với hàng triệu người dùng, 
            chia sẻ những khoảnh khắc quý báu và xây dựng cộng đồng của riêng bạn trên ChatMate.
          </p>
        </div>
      </div>
      
      {/* Form section */}
      <div className="w-full max-w-[600px] flex items-center justify-center relative z-20">
        <div className="w-full max-w-[420px] bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl p-10 m-4 border border-blue-100 animate-fade-in">
          <h1 className="text-4xl font-bold mb-3 text-center text-blue-700">Đăng ký</h1>
          <p className="text-center text-blue-500 mb-8">Tạo tài khoản ChatMate của bạn ngay bây giờ!</p>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-blue-700 font-semibold">Họ và tên</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Nhập tên của bạn"
                        className="border-blue-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-300 rounded-lg bg-blue-50/50"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-blue-700 font-semibold">Số điện thoại <span className="text-gray-500 text-sm font-normal">(Tùy chọn)</span></FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Nhập số điện thoại"
                        className="border-blue-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-300 rounded-lg bg-blue-50/50"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-blue-700 font-semibold">Email</FormLabel>
                    <FormControl>
                      <Input 
                        type="email"
                        placeholder="your@email.com"
                        className="border-blue-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-300 rounded-lg bg-blue-50/50"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-blue-700 font-semibold">Mật khẩu</FormLabel>
                      <FormControl>
                        <Input 
                          type="password"
                          placeholder="Ít nhất 6 kí tự"
                          className="border-blue-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-300 rounded-lg bg-blue-50/50"
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
                      <FormLabel className="text-blue-700 font-semibold">Xác nhận mật khẩu</FormLabel>
                      <FormControl>
                        <Input 
                          type="password"
                          placeholder="Nhập lại mật khẩu"
                          className="border-blue-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-300 rounded-lg bg-blue-50/50"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Button type="submit" className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-bold py-3 rounded-lg shadow-lg hover:shadow-xl transition-all transform hover:scale-105 duration-200" disabled={isLoading}>
                {isLoading ? "Đang đăng ký..." : "Đăng ký"}
              </Button>

              <p className="text-center text-sm text-gray-600 pt-2">
                Đã có tài khoản?{" "}
                <Link to="/auth/login" className="text-blue-600 hover:text-blue-700 font-semibold transition-colors">
                  Đăng nhập
                </Link>
              </p>
            </form>
          </Form>
        </div>
      </div>
    </div>
  )
}

export default Register