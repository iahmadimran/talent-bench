"use client"
import React from 'react'
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import Image from 'next/image'
import Link from 'next/link'
import { toast } from 'sonner'
import FormField from './FormField'
import { Form } from './ui/form'
import { useRouter } from 'next/navigation'
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth'
import { auth } from '@/firebase/client'
import { signIn, signUp } from '@/lib/actions/auth.action'


const authForm = (type: FormType) => {
  return z.object({
    name: type === 'sign-up' ? z.string().min(4).max(50) : z.string().optional(),
    email: z.string().email(),
    password: z.string().min(4).max(20)
  })
}

function AuthForm({ type }: { type: FormType }) {
  const router = useRouter();
  const formSchema = authForm(type)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: '',
      password: '',
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      if (isSignIn) {
        const { email, password } = values;

        const userCredential = await signInWithEmailAndPassword(auth, email, password)

        const idToken = await userCredential.user.getIdToken()

        if (!idToken) {
          toast.error('Sign in failed.')
          return
        }

        await signIn({
          email, idToken
        })

        toast.success('Sign in successfully.')
        router.push('/')
      } else {
        const { name, email, password } = values;

        const userCredentials = await createUserWithEmailAndPassword(auth, email, password)

        const result = await signUp({
          uid: userCredentials.user.uid,
          name: name!,
          email,
          password,
        })

        if (!result?.success) {
          toast.error(result?.message)
          return
        }

        toast.success('Account created successfully. Please sign in to proceed.')
        router.push('/sign-in')
      }
    } catch (error) {
      console.log(error);
      toast.error(`There was an error: ${error}`)
    }
  }

  const isSignIn = type === 'sign-in'

  return (
    <div className='card-border lg:min-w-[500px]'>
      <div className='flex flex-col gap-4 card py-10 px-10'>
        <div className='flex flex-row gap-2 justify-center'>
          <Image
            src='/logo.svg'
            alt='logo'
            width={34}
            height={28}
          />

          <h2 className='text-primary-100'>Talent Bench</h2>
        </div>

        <h3>Practice job interview with AI</h3>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="w-full space-y-4 mt-4 form">
            {!isSignIn && (
              <FormField
                control={form.control}
                name={'name'}
                label='Name'
                placeholder='Enter your name' 
              />
            )}

            <FormField
              control={form.control}
              name={'email'}
              label='Email'
              placeholder='Enter your email' 
              type='email'
            />

            <FormField
              control={form.control}
              name={'password'}
              label='Password'
              placeholder='Enter your password'
              type='password' 
            />

            <Button className='btn' type="submit">{isSignIn ? 'Sign In' : 'Sign Up'}</Button>
          </form>
        </Form>

        <p className='text-center'>
          {isSignIn ? 'No account yet?' : 'Have an account already?'}

          <Link href={isSignIn ? '/sign-up' : '/sign-in'} className='font-bold text-user-primary ml-1 hover:underline hover:text-purple-600'>

            {isSignIn ? 'Sign Up' : 'Sign In'}

          </Link>
        </p>
      </div>
    </div>
  )
}

export default AuthForm
