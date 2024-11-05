import { onIntegrateDomain } from '@/actions/settings'
import { zodResolver } from '@hookform/resolvers/zod'
import { UploadClient } from '@uploadcare/upload-client'
import { usePathname, useRouter } from 'next/navigation'

import { useEffect, useState } from 'react'
import { FieldValues, useForm } from 'react-hook-form'
import { useToast } from '../use-toast'
import { AddDomainSchema } from '@/schemas/settings.schema'

const upload = new UploadClient({
    publicKey: process.env.NEXT_PUBLIC_UPLOAD_CARE_PUBLIC_KEY as string,
})

export const useDomain = () => {
    const {
      register,
      handleSubmit,
      formState: { errors },
      reset,
    } = useForm<FieldValues>({
      resolver: zodResolver(AddDomainSchema),
    })
  
    const pathname = usePathname()
    const { toast } = useToast()
    const [loading, setLoading] = useState<boolean>(false)
    const [isDomain, setIsDomain] = useState<string | undefined>(undefined)
    const router = useRouter()
  
    //why do we need this hook?because we want to re-use life cycle methods inside comps
    useEffect(() => {
      setIsDomain(pathname.split('/').pop())
    }, [pathname])
  
    //handler
    const onAddDomain = handleSubmit(async (values: FieldValues) => {
      setLoading(true)
      const uploaded = await upload.uploadFile(values.image[0])
      const domain = await onIntegrateDomain(values.domain, uploaded.uuid)
      if (domain) {
        reset()
        setLoading(false)
        toast({
          title: domain.status == 200 ? 'Success' : 'Error',
          description: domain.message,
        })
        router.refresh()
      }
    })
  
    return {
      register,
      onAddDomain,
      errors,
      loading,
      isDomain,
    }
  }