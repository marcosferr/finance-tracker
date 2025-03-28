"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle2, Key, Shield, AlertCircle } from "lucide-react";
import { openaiService } from "@/lib/openai-service";
import type { UserSettings, Currency } from "@/types/finance";
import { AVAILABLE_CURRENCIES } from "@/types/finance";

export default function SettingsPage() {
  const [settings, setSettings] = useState<UserSettings>({});
  const [apiKey, setApiKey] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const [validationStatus, setValidationStatus] = useState<
    "idle" | "success" | "error"
  >("idle");
  const [validationMessage, setValidationMessage] = useState("");

  useEffect(() => {
    // Load settings on component mount
    const loadSettings = async () => {
      try {
        const response = await fetch("/api/settings");
        if (!response.ok) throw new Error("Failed to load settings");
        const data = await response.json();
        setSettings(data);

        // If there's an API key, show it as masked
        if (data.openaiApiKey) {
          setApiKey("••••••••••••••••••••••••••");
        }
      } catch (error) {
        console.error("Error loading settings:", error);
      }
    };

    loadSettings();
  }, []);

  const handleApiKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setApiKey(e.target.value);
    // Reset validation status when the key changes
    setValidationStatus("idle");
  };

  const validateApiKey = async () => {
    if (!apiKey || apiKey.includes("•")) return;

    setIsValidating(true);
    setValidationStatus("idle");

    try {
      const isValid = await openaiService.validateApiKey(apiKey);

      if (isValid) {
        // Save the valid API key
        const response = await fetch("/api/settings", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ openaiApiKey: apiKey }),
        });

        if (!response.ok) throw new Error("Failed to save API key");

        const savedSettings = await response.json();
        console.log(
          "Debug - Saved settings:",
          JSON.stringify(savedSettings, null, 2)
        );

        setValidationStatus("success");
        setValidationMessage("API key is valid!");

        // Mask the API key after successful validation
        setTimeout(() => {
          setApiKey("••••••••••••••••••••••••••");
        }, 1500);
      } else {
        setValidationStatus("error");
        setValidationMessage("Invalid API key. Please check and try again.");
      }
    } catch (error) {
      setValidationStatus("error");
      setValidationMessage("An error occurred while validating the API key.");
    } finally {
      setIsValidating(false);
    }
  };

  const clearApiKey = async () => {
    try {
      const response = await fetch("/api/settings", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ openaiApiKey: null }),
      });

      if (!response.ok) throw new Error("Failed to clear API key");

      setApiKey("");
      setValidationStatus("idle");
    } catch (error) {
      console.error("Error clearing API key:", error);
    }
  };

  const updateSetting = async (key: keyof UserSettings, value: any) => {
    try {
      const response = await fetch("/api/settings", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ [key]: value }),
      });

      if (!response.ok) throw new Error("Failed to update settings");

      const updatedSettings = await response.json();
      setSettings(updatedSettings);
    } catch (error) {
      console.error("Error updating settings:", error);
    }
  };

  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
      </div>

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="api">API Integration</TabsTrigger>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>
                Manage your general application settings.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currency">Currency</Label>
                <Select
                  value={settings.currency || "USD"}
                  onValueChange={(value) => updateSetting("currency", value)}
                >
                  <SelectTrigger id="currency">
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(AVAILABLE_CURRENCIES) as Currency[]).map(
                      (currency) => (
                        <SelectItem key={currency} value={currency}>
                          {currency} ({AVAILABLE_CURRENCIES[currency]})
                        </SelectItem>
                      )
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="language">Language</Label>
                <Select
                  value={settings.language || "en"}
                  onValueChange={(value) => updateSetting("language", value)}
                >
                  <SelectTrigger id="language">
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="es">Spanish</SelectItem>
                    <SelectItem value="fr">French</SelectItem>
                    <SelectItem value="de">German</SelectItem>
                    <SelectItem value="ja">Japanese</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="api" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                OpenAI API Integration
              </CardTitle>
              <CardDescription>
                Configure your OpenAI API key to enable AI-powered financial
                insights.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="apiKey">OpenAI API Key</Label>
                <div className="flex gap-2">
                  <Input
                    id="apiKey"
                    type="password"
                    placeholder="sk-..."
                    value={apiKey}
                    onChange={handleApiKeyChange}
                    className="flex-1"
                  />
                  <Button
                    onClick={validateApiKey}
                    disabled={isValidating || !apiKey || apiKey.includes("•")}
                  >
                    {isValidating ? "Validating..." : "Validate"}
                  </Button>
                  {apiKey && (
                    <Button variant="outline" onClick={clearApiKey}>
                      Clear
                    </Button>
                  )}
                </div>
              </div>

              {validationStatus === "success" && (
                <Alert className="bg-green-500/10 border-green-500/50">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <AlertTitle>Success</AlertTitle>
                  <AlertDescription>{validationMessage}</AlertDescription>
                </Alert>
              )}

              {validationStatus === "error" && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{validationMessage}</AlertDescription>
                </Alert>
              )}

              <div className="rounded-md bg-muted p-4">
                <div className="flex items-start gap-4">
                  <Shield className="mt-1 h-5 w-5 text-muted-foreground" />
                  <div>
                    <h4 className="text-sm font-medium">
                      Security Information
                    </h4>
                    <ul className="mt-2 list-disc space-y-2 pl-5 text-sm text-muted-foreground">
                      <li>Your API key is stored securely in our database.</li>
                      <li>
                        The key is only used for processing your PDF statements.
                      </li>
                      <li>
                        You can revoke access at any time by clearing your API
                        key.
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <p className="text-xs text-muted-foreground">
                Don't have an OpenAI API key?{" "}
                <a
                  href="https://platform.openai.com/signup"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline"
                >
                  Sign up here
                </a>
                .
              </p>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="appearance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Appearance</CardTitle>
              <CardDescription>
                Customize the appearance of the application.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="dark-mode">Dark Mode</Label>
                <Switch
                  id="dark-mode"
                  checked={settings.theme === "dark"}
                  onCheckedChange={(checked) =>
                    updateSetting("theme", checked ? "dark" : "light")
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
