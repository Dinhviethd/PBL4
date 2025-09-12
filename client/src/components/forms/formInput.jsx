import { hideOutline, placeholderCn } from "@/lib/className"
import { FormMessage, FormControl, FormField, FormItem, FormLabel  } from "../ui/form"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

const FormInput = ({form, name, label, type= 'text', placeholder}) => {
  return (
            <FormField
            control= {form.control} 
            name= {name}
            render= {({field}) => (
              <FormItem>
                {label && <FormLabel>{label}</FormLabel>}
                <FormControl>
                  <Input placeholder= {placeholder} type= {type} className={cn(hideOutline, placeholderCn)} {...field}/>  
                  {}
                </FormControl>
                <FormMessage/>
              </FormItem>
            )}
            />
  )
}

export default FormInput
