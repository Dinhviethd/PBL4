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
import { useState, useEffect } from "react"
import authService from "@/services/auth.service"
import { useTabCommunication } from "@/utils/tabCommunication"
import { useNotification } from "@/hooks/useNotification"

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
  const navigate = useNavigate();
  const tabCommunication = useTabCommunication();
  const { showSuccess, showError } = useNotification();

  // Đăng ký tab hiện tại là tab gốc cho password reset
  useEffect(() => {
    tabCommunication.registerAsPasswordResetTab();
    
    // Cleanup khi component unmount
    return () => {
      // Không clear tab info khi component unmount vì user có thể navigate đi nhưng vẫn muốn giữ tab info
    };
  }, [tabCommunication]);

  const onSubmit = async (data) => {
    try {
      setIsLoading(true);
      
      // Store password data temporarily for confirmation
      sessionStorage.setItem('pendingPasswordReset', JSON.stringify({
        email: data.email,
        newPassword: data.password
      }));
      
      // Send password reset request with confirmation email directly
      await authService.resetPasswordRequest(data.email, data.password, data.confirmPassword);
      
      showSuccess("Thành công", "Email xác nhận đã được gửi! Vui lòng kiểm tra email của bạn để xác nhận thay đổi mật khẩu.");
      
      navigate('/auth/login', { 
        state: { 
          message: 'Email xác nhận đã được gửi! Vui lòng kiểm tra email của bạn để xác nhận thay đổi mật khẩu.',
          type: 'info'
        }
      });
    } catch (err) {
      let errorMessage = "Yêu cầu thất bại. Vui lòng thử lại.";
      
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      showError("Lỗi", errorMessage);
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
          <h1 className="text-6xl font-extrabold mb-6 text-blue-700">Khôi Phục Mật Khẩu</h1>
          <p className="text-2xl mb-6 text-blue-600 font-semibold">Cập nhật mật khẩu của bạn</p>
          <p className="text-lg text-blue-500 leading-relaxed">
            Nhập email của bạn và tạo một mật khẩu mới. Chúng tôi sẽ gửi một email xác nhận để bảo vệ tài khoản của bạn.
            Quá trình này nhanh chóng và an toàn.
          </p>
        </div>
      </div>
      
      {/* Form section */}
      <div className="w-full max-w-[600px] flex items-center justify-center relative z-20">
        <div className="w-full max-w-[420px] bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl p-10 m-4 border border-blue-100 animate-fade-in">
          <h1 className="text-4xl font-bold mb-3 text-center text-blue-700">Thay đổi mật khẩu</h1>
          <p className="text-center text-blue-500 mb-8">Khôi phục tài khoản ChatMate của bạn</p>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-blue-700 font-semibold">Mật khẩu mới</FormLabel>
                    <FormControl>
                      <Input 
                        type="password"
                        placeholder="Nhập mật khẩu mới (tối thiểu 6 kí tự)"
                        disabled={isLoading}
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
                        placeholder="Xác nhận lại mật khẩu mới"
                        disabled={isLoading}
                        className="border-blue-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-300 rounded-lg bg-blue-50/50"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold py-2.5 rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl"
                disabled={isLoading}
              >
                {isLoading ? "Đang xử lý..." : "Gửi email xác nhận"}
              </Button>

              <div className="flex justify-center space-x-4 text-sm">
                <Link to="/auth/login" className="text-blue-600 hover:text-blue-700 hover:underline font-medium">
                  Quay lại đăng nhập
                </Link>
                <span className="text-blue-300">|</span>
                <Link to="/auth/register" className="text-blue-600 hover:text-blue-700 hover:underline font-medium">
                  Đăng ký
                </Link>
              </div>
            </form>
          </Form>
        </div>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) translateX(0px); }
          25% { transform: translateY(-20px) translateX(10px); }
          50% { transform: translateY(-40px) translateX(0px); }
          75% { transform: translateY(-20px) translateX(-10px); }
        }
        
        @keyframes float-reverse {
          0%, 100% { transform: translateY(0px) translateX(0px); }
          25% { transform: translateY(20px) translateX(-10px); }
          50% { transform: translateY(40px) translateX(0px); }
          75% { transform: translateY(20px) translateX(10px); }
        }

        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-float {
          animation: float 8s infinite ease-in-out;
        }

        .animate-float-reverse {
          animation: float-reverse 8s infinite ease-in-out;
        }

        .animate-fade-in {
          animation: fade-in 0.6s ease-out;
        }
      `}</style>
    </div>
  )
}

export default ForgotPassword