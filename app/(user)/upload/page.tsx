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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  FileText,
  Upload,
  AlertCircle,
  CheckCircle2,
  File,
  ArrowRight,
  Image,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { processPDFUpload } from "@/app/actions/process-pdf-upload";
import { saveExtractedTransactions } from "@/app/actions/save-extracted-transactions";
import type { ExtractedTransaction } from "@/lib/pdf-parser";
import { cn } from "@/lib/utils";

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<
    "idle" | "uploading" | "processing" | "success" | "error"
  >("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [accounts, setAccounts] = useState<any[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState("");
  const [extractedTransactions, setExtractedTransactions] = useState<
    ExtractedTransaction[]
  >([]);
  const [recentUploads, setRecentUploads] = useState<any[]>([]);
  const [activeStep, setActiveStep] = useState<"upload" | "review" | "history">(
    "upload"
  );
  const [isComponentMounted, setIsComponentMounted] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>(
    []
  );

  // Set component mounted flag
  useEffect(() => {
    setIsComponentMounted(true);
    return () => setIsComponentMounted(false);
  }, []);

  // Load accounts, categories and recent uploads
  useEffect(() => {
    if (!isComponentMounted) return;

    const fetchData = async () => {
      try {
        const accountsResponse = await fetch("/api/accounts");
        if (accountsResponse.ok) {
          const accountsList = await accountsResponse.json();
          setAccounts(accountsList);

          if (accountsList.length > 0 && !selectedAccountId) {
            setSelectedAccountId(accountsList[0].id);
          }
        }

        const categoriesResponse = await fetch("/api/categories");
        if (categoriesResponse.ok) {
          const categoriesList = await categoriesResponse.json();
          setCategories(categoriesList);
        }

        const uploadsResponse = await fetch("/api/uploads");
        if (uploadsResponse.ok) {
          const uploads = await uploadsResponse.json();
          setRecentUploads(uploads);
        }
      } catch (error) {
        console.error("Error loading initial data:", error);
      }
    };

    fetchData();
  }, [isComponentMounted, selectedAccountId]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Check if file is PDF or image
      const fileType = selectedFile.name.split(".").pop()?.toLowerCase();
      if (
        !["pdf", "jpg", "jpeg", "png", "gif", "webp", "bmp"].includes(
          fileType || ""
        )
      ) {
        setErrorMessage(
          "Only PDF and image files (JPG, PNG, etc.) are supported"
        );
        setUploadStatus("error");
        return;
      }

      setFile(selectedFile);
      setUploadStatus("idle");
      setUploadProgress(0);
      setExtractedTransactions([]);
      setErrorMessage("");
    }
  };

  const handleUpload = async () => {
    if (!file || !selectedAccountId) {
      setErrorMessage("Please select a PDF file and an account");
      setUploadStatus("error");
      return;
    }

    setUploadStatus("uploading");
    setErrorMessage("");

    // Simulate upload progress
    let progress = 0;
    const interval = setInterval(() => {
      if (!isComponentMounted) {
        clearInterval(interval);
        return;
      }

      progress += 10;
      setUploadProgress(progress);

      if (progress >= 100) {
        clearInterval(interval);
        processPDF();
      }
    }, 200);
  };

  const processPDF = async () => {
    if (!file || !selectedAccountId || !isComponentMounted) return;

    setUploadStatus("processing");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("accountId", selectedAccountId);

      const result = await processPDFUpload(formData);

      if (!isComponentMounted) return;

      if (!result.success) {
        // Provide more specific error messages for common issues
        if (result.error?.includes("Unsupported file type")) {
          setErrorMessage(
            "Only PDF and image files (JPG, PNG) are supported. PDF files are preferred for best results."
          );
        } else if (
          result.error?.includes("Invalid file data") ||
          result.error?.includes("unsupported MIME type")
        ) {
          setErrorMessage(
            "There was an issue processing your file. Please try uploading a PDF file instead of an image."
          );
        } else {
          setErrorMessage(result.error || "Error processing the document");
        }
        setUploadStatus("error");
        return;
      }

      if (
        result.processedTransactions &&
        result.processedTransactions.length > 0
      ) {
        setExtractedTransactions(result.processedTransactions);
        setUploadStatus("success");
        setActiveStep("review");
      } else {
        setErrorMessage(
          "No transactions found in the document. Please try a different file or format."
        );
        setUploadStatus("error");
      }

      // Refresh recent uploads
      const uploadsResponse = await fetch("/api/uploads");
      if (uploadsResponse.ok) {
        const uploads = await uploadsResponse.json();
        setRecentUploads(uploads);
      }
    } catch (error: any) {
      console.error("Error processing document:", error);
      if (isComponentMounted) {
        // Handle specific error types
        if (
          error.message?.includes("MIME type") ||
          error.message?.includes("file data")
        ) {
          setErrorMessage(
            "OpenAI currently has issues processing image files. Please try uploading a PDF document instead."
          );
        } else {
          setErrorMessage(
            error.message ||
              "An error occurred while processing the document. Please try again."
          );
        }
        setUploadStatus("error");
      }
    }
  };

  const handleSaveTransactions = async () => {
    if (!selectedAccountId || extractedTransactions.length === 0) return;

    try {
      const result = await saveExtractedTransactions(
        extractedTransactions,
        selectedAccountId
      );

      if (!result.success) {
        setErrorMessage(result.error || "Error saving transactions");
        return;
      }

      // Reset state
      setFile(null);
      setUploadProgress(0);
      setExtractedTransactions([]);
      setUploadStatus("idle");
      setActiveStep("upload");

      // Show success message
      alert("Transactions saved successfully!");
    } catch (error) {
      console.error("Error saving transactions:", error);
      setErrorMessage(
        "An error occurred while saving transactions. Please try again."
      );
    }
  };

  const getFileIcon = (filename: string) => {
    const extension = filename.split(".").pop()?.toLowerCase();

    if (extension === "pdf") {
      return <FileText className="h-4 w-4" />;
    }

    if (
      ["jpg", "jpeg", "png", "gif", "webp", "bmp"].includes(extension || "")
    ) {
      return <Image className="h-4 w-4" />;
    }

    return <File className="h-4 w-4" />;
  };

  const handleTransactionEdit = (
    index: number,
    field: keyof ExtractedTransaction,
    value: string | number
  ) => {
    setExtractedTransactions((prev) => {
      const newTransactions = [...prev];
      newTransactions[index] = {
        ...newTransactions[index],
        [field]: value,
      };
      return newTransactions;
    });
  };

  const handleEditStart = (index: number) => {
    setEditingIndex(index);
  };

  const handleEditEnd = () => {
    setEditingIndex(null);
  };

  // Render upload step
  const renderUploadStep = () => (
    <Card>
      <CardHeader>
        <CardTitle>Upload Financial Document</CardTitle>
        <CardDescription>
          Upload a PDF or image file containing your financial statement.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid w-full gap-2">
          <Label htmlFor="account">Account</Label>
          <Select
            value={selectedAccountId}
            onValueChange={setSelectedAccountId}
          >
            <SelectTrigger className="w-full md:w-[300px]">
              <SelectValue placeholder="Select an account" />
            </SelectTrigger>
            <SelectContent>
              {accounts.map((account) => (
                <SelectItem key={account.id} value={account.id}>
                  {account.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label
            htmlFor="file-upload"
            className="cursor-pointer w-full border-2 border-dashed rounded-lg p-6 border-border flex flex-col items-center justify-center gap-2 hover:border-primary/50 transition-colors"
          >
            <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center text-muted-foreground mb-2">
              <Upload className="h-6 w-6" />
            </div>
            <div className="flex flex-col items-center justify-center space-y-1">
              <p className="text-sm font-medium">
                Click to upload or drag and drop
              </p>
              <p className="text-sm text-muted-foreground">
                PDF or image files (JPG, PNG) supported
              </p>
            </div>
            <Input
              id="file-upload"
              type="file"
              className="hidden"
              onChange={handleFileChange}
              accept=".pdf,.jpg,.jpeg,.png,.gif,.webp,.bmp"
            />
          </Label>
        </div>

        {file && (
          <div className="flex items-center gap-2 p-2 bg-muted rounded-md">
            {getFileIcon(file.name)}
            <span className="text-sm font-medium truncate">{file.name}</span>
            <Badge variant="outline" className="ml-auto">
              {Math.round(file.size / 1024)} KB
            </Badge>
          </div>
        )}

        <Button
          onClick={handleUpload}
          disabled={
            !file ||
            !selectedAccountId ||
            uploadStatus === "uploading" ||
            uploadStatus === "processing"
          }
          className="mt-2"
        >
          <Upload className="mr-2 h-4 w-4" />
          Upload
        </Button>

        {uploadStatus === "uploading" && (
          <div className="space-y-2">
            <Progress value={uploadProgress} />
            <p className="text-sm text-muted-foreground">
              Uploading... {uploadProgress}%
            </p>
          </div>
        )}

        {uploadStatus === "processing" && (
          <div className="space-y-2">
            <Progress value={100} className="animate-pulse" />
            <p className="text-sm text-muted-foreground">
              Processing document...
            </p>
          </div>
        )}

        {uploadStatus === "error" && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        )}
      </CardContent>
      <CardFooter className="flex flex-col items-start gap-4">
        <div className="text-sm text-muted-foreground">
          <p className="font-medium">Important Notes:</p>
          <ul className="list-disc list-inside space-y-1 mt-2">
            <li className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              PDF files are preferred for best results
            </li>
            <li className="flex items-center gap-2">
              <Image className="h-4 w-4" />
              Image files (JPG, PNG) are processed using OCR technology
            </li>
            <li>
              The system will attempt to categorize your transactions
              automatically
            </li>
            <li>
              You can review and modify the extracted transactions before saving
            </li>
          </ul>
        </div>
      </CardFooter>
    </Card>
  );

  // Render review step
  const renderReviewStep = () => (
    <Card>
      <CardHeader>
        <CardTitle>Review Extracted Transactions</CardTitle>
        <CardDescription>
          Review and edit the transactions extracted from your document before
          saving them to your account.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {extractedTransactions.length > 0 ? (
          <div className="rounded-md border">
            <div className="relative w-full overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {extractedTransactions.map((transaction, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        {editingIndex === index ? (
                          <Input
                            type="date"
                            value={transaction.date}
                            onChange={(e) =>
                              handleTransactionEdit(
                                index,
                                "date",
                                e.target.value
                              )
                            }
                            onBlur={handleEditEnd}
                            className="h-8"
                          />
                        ) : (
                          <span
                            onClick={() => handleEditStart(index)}
                            className="cursor-pointer"
                          >
                            {transaction.date}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {editingIndex === index ? (
                          <Input
                            value={transaction.description}
                            onChange={(e) =>
                              handleTransactionEdit(
                                index,
                                "description",
                                e.target.value
                              )
                            }
                            onBlur={handleEditEnd}
                            className="h-8"
                          />
                        ) : (
                          <span
                            onClick={() => handleEditStart(index)}
                            className="cursor-pointer"
                          >
                            {transaction.description}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {editingIndex === index ? (
                          <Select
                            value={transaction.category}
                            onValueChange={(value) =>
                              handleTransactionEdit(index, "category", value)
                            }
                            onOpenChange={(open) => !open && handleEditEnd()}
                          >
                            <SelectTrigger className="h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {categories.map((category) => (
                                <SelectItem
                                  key={category.id}
                                  value={category.name}
                                >
                                  {category.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <Badge
                            variant="outline"
                            className="cursor-pointer"
                            onClick={() => handleEditStart(index)}
                          >
                            {transaction.category}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {editingIndex === index ? (
                          <Input
                            type="number"
                            value={transaction.amount}
                            onChange={(e) =>
                              handleTransactionEdit(
                                index,
                                "amount",
                                parseFloat(e.target.value)
                              )
                            }
                            onBlur={handleEditEnd}
                            className="h-8 text-right"
                          />
                        ) : (
                          <span
                            onClick={() => handleEditStart(index)}
                            className={cn(
                              "cursor-pointer font-medium",
                              transaction.amount >= 0
                                ? "text-green-500"
                                : "text-red-500"
                            )}
                          >
                            {transaction.amount >= 0 ? "+" : ""}
                            {Math.abs(transaction.amount).toLocaleString()}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setExtractedTransactions((prev) =>
                              prev.filter((_, i) => i !== index)
                            );
                          }}
                        >
                          Delete
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">No transactions found</h3>
            <p className="text-sm text-muted-foreground mt-2">
              No transactions could be extracted from the document. Please try a
              different file or format.
            </p>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={() => setActiveStep("upload")}>
          Back to Upload
        </Button>
        <Button
          onClick={handleSaveTransactions}
          disabled={extractedTransactions.length === 0}
        >
          Save {extractedTransactions.length} Transactions
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );

  // Render history step
  const renderHistoryStep = () => (
    <Card>
      <CardHeader>
        <CardTitle>Recent Uploads</CardTitle>
        <CardDescription>
          View your recent document uploads and their processing status.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>File</TableHead>
              <TableHead>Account</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Transactions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {recentUploads.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center">
                  No uploads found
                </TableCell>
              </TableRow>
            ) : (
              recentUploads.map((upload) => (
                <TableRow key={upload.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {getFileIcon(upload.filename)}
                      <span className="truncate max-w-[200px]">
                        {upload.filename}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>{upload.account?.name || "-"}</TableCell>
                  <TableCell>
                    {new Date(upload.uploadDate).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        upload.status === "completed"
                          ? "default"
                          : upload.status === "processing"
                          ? "outline"
                          : "destructive"
                      }
                    >
                      {upload.status.charAt(0).toUpperCase() +
                        upload.status.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {upload.transactionCount || 0}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );

  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">
          Upload Financial Documents
        </h2>
        <div className="flex gap-2">
          <Button
            variant={activeStep === "upload" ? "default" : "outline"}
            onClick={() => setActiveStep("upload")}
          >
            Upload
          </Button>
          <Button
            variant={activeStep === "review" ? "default" : "outline"}
            onClick={() => setActiveStep("review")}
            disabled={extractedTransactions.length === 0}
          >
            Review
          </Button>
          <Button
            variant={activeStep === "history" ? "default" : "outline"}
            onClick={() => setActiveStep("history")}
          >
            History
          </Button>
        </div>
      </div>

      {activeStep === "upload" && renderUploadStep()}
      {activeStep === "review" && renderReviewStep()}
      {activeStep === "history" && renderHistoryStep()}
    </div>
  );
}
