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
import { useTheme } from "next-themes";
import { useTranslations } from "next-intl";

export default function SettingsPage() {
  const t = useTranslations();
  const [settings, setSettings] = useState<UserSettings>({});
  const { theme, setTheme } = useTheme();
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

      // If language is updated, update localStorage
      if (key === "language") {
        localStorage.setItem("user-language", value);
      }
    } catch (error) {
      console.error("Error updating settings:", error);
    }
  };

  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">
          {t("settings.title")}
        </h2>
      </div>

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList>
          <TabsTrigger value="general">
            {t("settings.general.title")}
          </TabsTrigger>
          <TabsTrigger value="appearance">
            {t("settings.appearance.title")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t("settings.general.title")}</CardTitle>
              <CardDescription>
                {t("settings.general.description")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currency">
                  {t("settings.general.currency")}
                </Label>
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
                <Label htmlFor="language">
                  {t("settings.general.language")}
                </Label>
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

        <TabsContent value="appearance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t("settings.appearance.title")}</CardTitle>
              <CardDescription>
                {t("settings.appearance.description")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="dark-mode">
                  {t("settings.appearance.darkMode")}
                </Label>
                <Switch
                  id="dark-mode"
                  checked={theme === "dark"}
                  onCheckedChange={(checked) =>
                    setTheme(checked ? "dark" : "light")
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
