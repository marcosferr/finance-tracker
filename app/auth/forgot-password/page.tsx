"use client"

import { useState } from "react"
import Link from "next/link"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Wallet2, AlertCircle, CheckCircle, ArrowLeft } from "lucide-react"

const forgotPasswordSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
})

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  })

  const onSubmit = async (data: ForgotPasswordFormValues) => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok) {
        setError(result.error || "Failed to send reset email")
        return
      }

      setSuccess(true)
    } catch (error) {
      console.error("Forgot password error:", error)
      setError("An error occurred. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/40 p-4">
      <div className="flex w-full max-w-[350px] flex-col justify-center space-y-6">
        <div className="flex flex-col space-y-2 text-center">
          <div className="mb-4 flex items-center justify-center">
            <Wallet2 className="h-10 w-10 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">Forgot Password</h1>
          <p className="text-sm text-muted-foreground">Enter your email address to receive a password reset link</p>
        </div>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success ? (
              <div className="space-y-4">
                <Alert className="border-green-500 bg-green-500/10 text-green-500">
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    If an account exists with that email, we've sent a password reset link.
                  </AlertDescription>
                </Alert>
                <div className="text-center">
                  <Link href="/auth/login" className="text-primary hover:underline">
                    <Button variant="link" className="gap-1">
                      <ArrowLeft className="h-4 w-4" />
                      Back to login
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-1">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" placeholder="name@example.com" {...register("email")} />
                  {errors.email && <p className="text-sm font-medium text-destructive">{errors.email.message}</p>}
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Sending..." : "Send reset link"}
                </Button>
              </form>
            )}
          </CardContent>

          {!success && (
            <CardFooter className="flex justify-center p-6 pt-0">
              <p className="text-center text-sm text-muted-foreground">
                Remember your password?{" "}
                <Link href="/auth/login" className="text-primary hover:underline">
                  Back to login
                </Link>
              </p>
            </CardFooter>
          )}
        </Card>
      </div>
    </div>
  )
}

