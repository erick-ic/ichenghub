'use client'

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { useFormState, useFormStatus } from "react-dom"

const initialState = {
  message: null,
  success: false,
}

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "保存中..." : "保存"}
    </Button>
  )
}

interface ToolFormProps {
  action: (prevState: any, formData: FormData) => Promise<any>
  defaultValues?: {
    id?: string
    name?: string
    nameEn?: string
    desc?: string
    descEn?: string
    url?: string
    logoUrl?: string
    category?: string
    categoryEn?: string
  }
}

export function ToolForm({ action, defaultValues }: ToolFormProps) {
  const [state, formAction] = useFormState(action, initialState)

  return (
    <form action={formAction} className="space-y-4">
      {defaultValues?.id && (
        <input type="hidden" name="id" value={defaultValues.id} />
      )}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">工具名称</Label>
          <Input
            id="name"
            name="name"
            defaultValue={defaultValues?.name}
            placeholder="例如：DeepSeek"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="nameEn">英文名称</Label>
          <Input
            id="nameEn"
            name="nameEn"
            defaultValue={defaultValues?.nameEn}
            placeholder="例如：DeepSeek"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="desc">描述</Label>
          <Input
            id="desc"
            name="desc"
            defaultValue={defaultValues?.desc}
            placeholder="简短描述"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="descEn">英文描述</Label>
          <Input
            id="descEn"
            name="descEn"
            defaultValue={defaultValues?.descEn}
            placeholder="英文描述"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="url">访问链接 <span className="text-gray-400 text-xs">(可选)</span></Label>
        <Input
          id="url"
          name="url"
          defaultValue={defaultValues?.url}
          placeholder="https://..."
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="category">分类</Label>
          <Input
            id="category"
            name="category"
            defaultValue={defaultValues?.category}
            placeholder="例如：AI工具"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="categoryEn">英文分类</Label>
          <Input
            id="categoryEn"
            name="categoryEn"
            defaultValue={defaultValues?.categoryEn}
            placeholder="例如：AI Tools"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="logoUrl">Logo 地址</Label>
        <Input
          id="logoUrl"
          name="logoUrl"
          defaultValue={defaultValues?.logoUrl}
          placeholder="https://..."
          required
        />
      </div>

      <div className="flex justify-end pt-4">
        <SubmitButton />
      </div>

      {state?.message && (
        <p className={state.success ? "text-green-600" : "text-red-600"}>
          {state.message}
        </p>
      )}
    </form>
  )
}
