"use client"

import { useState } from "react"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, CheckCircle } from "lucide-react"

const profileSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
})

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, { message: "Current password is required" }),
    newPassword: z
      .string()
      .min(8, { message: "Password must be at least 8 characters" })
      .regex(/[A-Z]/, { message: "Password must contain at least one uppercase letter" })
      .regex(/[a-z]/, { message: "Password must contain at least one lowercase letter" })
      .regex(/[0-9]/, { message: "Password must contain at least one number" }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })

type ProfileFormValues = z.infer<typeof profileSchema>
type PasswordFormValues = z.infer<typeof passwordSchema>

export default function AccountSettingsPage() {
  const { data: session, update } = useSession()
  const [profileLoading, setProfileLoading] = useState(false)
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [profileError, setProfileError] = useState<string | null>(null)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [profileSuccess, setProfileSuccess] = useState(false)
  const [passwordSuccess, setPasswordSuccess] = useState(false)

  const {
    register: registerProfile,
    handleSubmit: handleSubmitProfile,
    formState: { errors: profileErrors },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: session?.user?.name || "",
    },
  })

  const {
    register: registerPassword,
    handleSubmit: handleSubmitPassword,
    reset: resetPassword,
    formState: { errors: passwordErrors },
  } = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  })

  const onProfileSubmit = async (data: ProfileFormValues) => {
    try {
      setProfileLoading(true)
      setProfileError(null)
      setProfileSuccess(false)

      const response = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok) {
        setProfileError(result.error || "Failed to update profile")
        return
      }

      // Update session data
      await update({
        ...session,
        user: {
          ...session?.user,
          name: data.name,
        },
      })

      setProfileSuccess(true)
    } catch (error) {
      console.error("Profile update error:", error)
      setProfileError("An error occurred. Please try again.")
    } finally {
      setProfileLoading(false)
    }
  }

  const onPasswordSubmit = async (data: PasswordFormValues) => {
    try {
      setPasswordLoading(true)
      setPasswordError(null)
      setPasswordSuccess(false)

      const response = await fetch("/api/user/password", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currentPassword: data.currentPassword,
          newPassword: data.newPassword,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        setPasswordError(result.error || "Failed to update password")
        return
      }

      setPasswordSuccess(true)
      resetPassword()
    } catch (error) {
      console.error("Password update error:", error)
      setPasswordError("An error occurred. Please try again.")
    } finally {
      setPasswordLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Account Settings</h3>
        <p className="text-sm text-muted-foreground">Manage your account settings and change your password</p>
      </div>
      <Separator />

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
            <CardDescription>Update your basic profile information</CardDescription>
          </CardHeader>
          <CardContent>
            {profileError && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{profileError}</AlertDescription>
              </Alert>
            )}

            {profileSuccess && (
              <Alert className="mb-4 border-green-500 bg-green-500/10 text-green-500">
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>Profile updated successfully!</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmitProfile(onProfileSubmit)} className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="name">Name</Label>
                <Input id="name" {...registerProfile("name")} />
                {profileErrors.name && (
                  <p className="text-sm font-medium text-destructive">{profileErrors.name.message}</p>
                )}
              </div>

              <div className="space-y-1">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={session?.user?.email || ""} disabled />
                <p className="text-xs text-muted-foreground">Your email cannot be changed</p>
              </div>

              <Button type="submit" disabled={profileLoading}>
                {profileLoading ? "Saving..." : "Save changes"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Change Password</CardTitle>
            <CardDescription>Update your password to secure your account</CardDescription>
          </CardHeader>
          <CardContent>
            {passwordError && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{passwordError}</AlertDescription>
              </Alert>
            )}

            {passwordSuccess && (
              <Alert className="mb-4 border-green-500 bg-green-500/10 text-green-500">
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>Password updated successfully!</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmitPassword(onPasswordSubmit)} className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="currentPassword">Current Password</Label>
                <Input id="currentPassword" type="password" {...registerPassword("currentPassword")} />
                {passwordErrors.currentPassword && (
                  <p className="text-sm font-medium text-destructive">{passwordErrors.currentPassword.message}</p>
                )}
              </div>

              <div className="space-y-1">
                <Label htmlFor="newPassword">New Password</Label>
                <Input id="newPassword" type="password" {...registerPassword("newPassword")} />
                {passwordErrors.newPassword && (
                  <p className="text-sm font-medium text-destructive">{passwordErrors.newPassword.message}</p>
                )}
              </div>

              <div className="space-y-1">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input id="confirmPassword" type="password" {...registerPassword("confirmPassword")} />
                {passwordErrors.confirmPassword && (
                  <p className="text-sm font-medium text-destructive">{passwordErrors.confirmPassword.message}</p>
                )}
              </div>

              <Button type="submit" disabled={passwordLoading}>
                {passwordLoading ? "Updating..." : "Update password"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

