"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, ArrowLeft } from "lucide-react";

export default function AuthErrorPage() {
  const searchParams = useSearchParams();
  const [errorMessage, setErrorMessage] = useState<string>(
    "An error occurred during authentication"
  );

  useEffect(() => {
    const error = searchParams.get("error");

    if (error) {
      switch (error) {
        case "Configuration":
          setErrorMessage("There is a problem with the server configuration.");
          break;
        case "AccessDenied":
          setErrorMessage("You do not have access to sign in.");
          break;
        case "Verification":
          setErrorMessage(
            "The verification token has expired or has already been used."
          );
          break;
        case "OAuthSignin":
          setErrorMessage("Error in the OAuth sign-in process.");
          break;
        case "OAuthCallback":
          setErrorMessage("Error in the OAuth callback process.");
          break;
        case "OAuthCreateAccount":
          setErrorMessage(
            "Could not create OAuth provider user in the database."
          );
          break;
        case "EmailCreateAccount":
          setErrorMessage(
            "Could not create email provider user in the database."
          );
          break;
        case "Callback":
          setErrorMessage("Error in the OAuth callback handler.");
          break;
        case "OAuthAccountNotLinked":
          setErrorMessage(
            "The email on the account is already linked, but not with this OAuth account."
          );
          break;
        case "EmailSignin":
          setErrorMessage("The email could not be sent.");
          break;
        case "CredentialsSignin":
          setErrorMessage(
            "The sign in attempt failed. The username or password may be incorrect."
          );
          break;
        case "SessionRequired":
          setErrorMessage("You must be signed in to access this page.");
          break;
        default:
          setErrorMessage(`An authentication error occurred: ${error}`);
      }
    }
  }, [searchParams]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-xl">Authentication Error</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Link href="/auth/login">
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Login
            </Button>
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
