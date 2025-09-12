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
import { useGoogleLogin } from "@react-oauth/google"
//định nghĩa validate cho form
const formSchema = z.object({
  username: z.string().min(2, { message: "Tên đăng nhập phải chứa ít nhất 2 kí tự."}),
  password: z.string().min(6, { message: "Mật khẩu phải chứa ít nhất 6 kí tự." }),
  fullname: z.string().min(1, {message: "Tên người dùng là bắt buộc"})
})
const login = () => {
  const form = useForm({
    resolver: zodResolver(formSchema), 
    defaultValues: {
      username: " ",
      password: " ",
    }
  })
  const [variant, setVariant] = useState("SIGNIN")
  const toggleVariant= () => {
    if (variant === 'SIGNIN') setVariant("SIGNUP")
      else setVariant("SIGNIN")
  }
  const handleSignInGoogle= useGoogleLogin({
  onSuccess: tokenResponse => console.log(tokenResponse),
  onError: err => console.log(err)
});
  return (
    <div>
    </div>
  )
}

export default login