"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Play,
  Server,
  Clock,
  CheckCircle2,
  AlertCircle,
  Copy,
  User,
  ExternalLink,
  StopCircle,
  Target,
  BookOpen,
  List,
  Award,
  Search,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface LabResponse {
  signin_url: string
  expires_at: string
  cleanup_scheduled: boolean
  cleanup_rule: string
  duration_minutes: number
}

export default function Component() {
  const [showUsernameDialog, setShowUsernameDialog] = useState(false)
  const [showEndLabDialog, setShowEndLabDialog] = useState(false)
  const [showApiErrorDialog, setShowApiErrorDialog] = useState(false)
  const [showCongratulationsDialog, setShowCongratulationsDialog] = useState(false)
  const [showNoInstanceDialog, setShowNoInstanceDialog] = useState(false)
  const [apiErrorMessage, setApiErrorMessage] = useState("")
  const [apiErrorTitle, setApiErrorTitle] = useState("")
  const [username, setUsername] = useState("")
  const [labStarted, setLabStarted] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState(30 * 60) // 30 minutes in seconds
  const [taskCompleted, setTaskCompleted] = useState(false)
  const [labResponse, setLabResponse] = useState<LabResponse | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isEndingLab, setIsEndingLab] = useState(false)
  const [isCheckingProgram, setIsCheckingProgram] = useState(false)
  const { toast } = useToast()

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (labStarted && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining((prev) => prev - 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [labStarted, timeRemaining])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast({
        title: "Copied!",
        description: `${label} copied to clipboard`,
      })
    } catch (err) {
      toast({
        title: "Copy failed",
        description: "Failed to copy to clipboard",
        variant: "destructive",
      })
    }
  }

  const showApiError = (title: string, message: string) => {
    setApiErrorTitle(title)
    setApiErrorMessage(message)
    setShowApiErrorDialog(true)
  }

  const resetLabState = () => {
    setLabStarted(false)
    setTimeRemaining(30 * 60)
    setTaskCompleted(false)
    setLabResponse(null)
  }

  const startLabRequest = () => {
    setShowUsernameDialog(true)
  }

  const handleStartLab = async () => {
    if (!username.trim()) {
      showApiError("Username Required", "Please enter a username to start the lab.")
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch("https://s3b455p78l.execute-api.us-east-1.amazonaws.com/demo-1", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: username.trim(),
          duration: 1800,
        }),
      })

      if (!response.ok) {
        const errorData = await response.text().catch(() => "Unknown error")
        throw new Error(`Failed to start lab: ${response.status} - ${errorData}`)
      }

      const data: LabResponse = await response.json()
      setLabResponse(data)
      setLabStarted(true)
      setShowUsernameDialog(false)

      toast({
        title: "Lab Started!",
        description: "Your AWS lab environment is now ready",
      })
    } catch (error) {
      console.error("Error starting lab:", error)
      const errorMessage = error instanceof Error ? error.message : "Failed to start lab. Please try again."
      showApiError("Error Starting Lab", errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const handleEndLabRequest = () => {
    setShowEndLabDialog(true)
  }

  const handleEndLab = async () => {
    setIsEndingLab(true)
    setShowEndLabDialog(false)

    try {
      const response = await fetch("https://s3b455p78l.execute-api.us-east-1.amazonaws.com/delete/demo-1", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: username,
          tag_name: username,
        }),
      })

      if (!response.ok) {
        const errorData = await response.text().catch(() => "Unknown error")
        throw new Error(`Failed to end lab: ${response.status} - ${errorData}`)
      }

      // Success - reset everything
      resetLabState()
      setUsername("")

      toast({
        title: "Lab Ended",
        description: "Your lab session has been successfully terminated",
      })
    } catch (error) {
      console.error("Error ending lab:", error)
      const errorMessage = error instanceof Error ? error.message : "Failed to end lab. Please try again."
      showApiError("Error Ending Lab", errorMessage)
    } finally {
      setIsEndingLab(false)
    }
  }

  const handleCheckProgram = async () => {
    setIsCheckingProgram(true)

    try {
      const response = await fetch("https://s3b455p78l.execute-api.us-east-1.amazonaws.com/list/demo-1", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tag_key: "Name",
          tag_value: username,
        }),
      })

      if (!response.ok) {
        const errorData = await response.text().catch(() => "Unknown error")
        throw new Error(`Failed to check program: ${response.status} - ${errorData}`)
      }

      const result = await response.json()

      if (result === true || result.success === true) {
        // Instance found - complete the task
        setTaskCompleted(true)
        setShowCongratulationsDialog(true)
      } else {
        // Instance not found - show error dialog
        setShowNoInstanceDialog(true)
      }
    } catch (error) {
      console.error("Error checking program:", error)
      const errorMessage = error instanceof Error ? error.message : "Failed to check program. Please try again."
      showApiError("Error Checking Program", errorMessage)
    } finally {
      setIsCheckingProgram(false)
    }
  }

  const handleCongratulationsClose = async () => {
    setShowCongratulationsDialog(false)

    // Automatically end the lab after congratulations
    try {
      const response = await fetch("https://s3b455p78l.execute-api.us-east-1.amazonaws.com/delete/demo-1", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: username,
          tag_name: username,
        }),
      })

      if (!response.ok) {
        const errorData = await response.text().catch(() => "Unknown error")
        throw new Error(`Failed to end lab: ${response.status} - ${errorData}`)
      }

      // Success - reset everything
      resetLabState()
      setUsername("")

      toast({
        title: "Lab Completed!",
        description: "Congratulations! Your lab has been successfully completed and terminated.",
      })
    } catch (error) {
      console.error("Error ending lab:", error)
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Lab completed successfully, but failed to terminate automatically. Please manually end the session."
      showApiError("Error Completing Lab", errorMessage)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Username Dialog */}
      <Dialog open={showUsernameDialog} onOpenChange={setShowUsernameDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <User className="h-5 w-5" />
              <span>Enter Username</span>
            </DialogTitle>
            <DialogDescription>Please enter your username to start the AWS lab session.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleStartLab()}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUsernameDialog(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button onClick={handleStartLab} disabled={isLoading}>
              {isLoading ? "Starting Lab..." : "Start Lab"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* End Lab Confirmation Dialog */}
      <AlertDialog open={showEndLabDialog} onOpenChange={setShowEndLabDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>End Lab Session?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to end this lab session? This will terminate all resources and cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleEndLab} className="bg-red-600 hover:bg-red-700">
              End Lab
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Generic API Error Dialog */}
      <AlertDialog open={showApiErrorDialog} onOpenChange={setShowApiErrorDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center space-x-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              <span>{apiErrorTitle}</span>
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>{apiErrorMessage}</p>
              <div className="bg-red-50 p-3 rounded-lg mt-3">
                <p className="text-sm text-red-800">
                  <strong>If the problem persists:</strong>
                </p>
                <ul className="text-sm text-red-700 mt-2 space-y-1 list-disc list-inside">
                  <li>Check your internet connection</li>
                  <li>Wait a few moments and try again</li>
                  <li>Contact support if the issue continues</li>
                </ul>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setShowApiErrorDialog(false)}>OK</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* No Instance Found Dialog */}
      <AlertDialog open={showNoInstanceDialog} onOpenChange={setShowNoInstanceDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center space-x-2 text-orange-600">
              <Search className="h-5 w-5" />
              <span>Instance Not Found</span>
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>No EC2 instance found with the desired configurations.</p>
              <div className="bg-orange-50 p-3 rounded-lg mt-3">
                <p className="text-sm text-orange-800">
                  <strong>Please ensure you have:</strong>
                </p>
                <ul className="text-sm text-orange-700 mt-2 space-y-1 list-disc list-inside">
                  <li>Created an EC2 instance in the AWS Console</li>
                  <li>
                    Tagged the instance with Name: <code className="bg-white px-1 rounded">{username}</code>
                  </li>
                  <li>Used the specified configurations (Amazon Linux, t2.micro/t3.micro, etc.)</li>
                  <li>Waited for the instance to be in "running" state</li>
                </ul>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setShowNoInstanceDialog(false)}>Try Again</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Congratulations Dialog */}
      <AlertDialog open={showCongratulationsDialog} onOpenChange={setShowCongratulationsDialog}>
        <AlertDialogContent className="sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center space-x-2 text-green-600">
              <Award className="h-6 w-6" />
              <span>Congratulations!</span>
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center py-4">
              <div className="space-y-2">
                <div className="text-4xl">🎉</div>
                <div className="text-lg font-medium text-gray-900">Lab Completed Successfully!</div>
                <div className="text-sm text-gray-600">
                  You have successfully created an EC2 instance with the required configurations. Great job on
                  completing this training lab!
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={handleCongratulationsClose} className="bg-green-600 hover:bg-green-700">
              Complete Lab
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Server className="h-8 w-8 text-orange-500" />
                <div>
                  <h1 className="text-xl font-semibold text-gray-900">AWS Cloud Sandboxes</h1>
                  <p className="text-sm text-gray-500">Creating EC2 Instance</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {labStarted && (
                <Badge
                  variant="outline"
                  className={`${timeRemaining > 300 ? "bg-green-50 text-green-700 border-green-200" : "bg-red-50 text-red-700 border-red-200"}`}
                >
                  <Clock className="w-3 h-3 mr-1" />
                  {formatTime(timeRemaining)}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Panel - Lab Controls */}
          <div className="lg:col-span-1">
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle className="text-lg">Lab Control</CardTitle>
                <CardDescription>Manage your lab session</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {!labStarted ? (
                  <Button onClick={startLabRequest} className="w-full bg-green-600 hover:bg-green-700">
                    <Play className="w-4 h-4 mr-2" />
                    Start Lab
                  </Button>
                ) : (
                  <div className="space-y-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900">{formatTime(timeRemaining)}</div>
                      <div className="text-sm text-gray-500">Time Remaining</div>
                    </div>

                    <div className={`p-3 rounded-lg ${timeRemaining > 300 ? "bg-green-50" : "bg-red-50"}`}>
                      <div className="flex items-center space-x-2">
                        {timeRemaining > 300 ? (
                          <CheckCircle2 className="w-4 h-4 text-green-600" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-red-600" />
                        )}
                        <span
                          className={`text-sm font-medium ${timeRemaining > 300 ? "text-green-800" : "text-red-800"}`}
                        >
                          {timeRemaining > 300 ? "Lab Active" : "Time Running Low"}
                        </span>
                      </div>
                    </div>

                    <Button
                      onClick={handleEndLabRequest}
                      variant="destructive"
                      className="w-full"
                      disabled={isEndingLab}
                    >
                      <StopCircle className="w-4 h-4 mr-2" />
                      {isEndingLab ? "Ending Lab..." : "End Lab"}
                    </Button>
                  </div>
                )}

                {/* Lab Credentials */}
                {labResponse && labStarted && (
                  <div className="space-y-3">
                    <Separator />
                    <h4 className="text-sm font-medium text-gray-700">Lab Credentials</h4>

                    <div className="space-y-3">
                      <div className="space-y-1">
                        <Label className="text-xs text-gray-600">Username</Label>
                        <div className="flex space-x-1">
                          <Input value={username} readOnly className="text-sm" />
                          <Button size="sm" variant="outline" onClick={() => copyToClipboard(username, "Username")}>
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <Label className="text-xs text-gray-600">Expires At</Label>
                        <div className="flex space-x-1">
                          <Input value={formatDateTime(labResponse.expires_at)} readOnly className="text-sm" />
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => copyToClipboard(formatDateTime(labResponse.expires_at), "Expiry time")}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <Label className="text-xs text-gray-600">AWS Console URL</Label>
                        <div className="flex space-x-1">
                          <Input value={labResponse.signin_url} readOnly className="text-sm" />
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => copyToClipboard(labResponse.signin_url, "Sign-in URL")}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>

                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full"
                        onClick={() => window.open(labResponse.signin_url, "_blank")}
                      >
                        <ExternalLink className="h-3 w-3 mr-1" />
                        Open AWS Console
                      </Button>
                    </div>
                  </div>
                )}

                <Separator />

                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-gray-700">Lab Information</h4>
                  <div className="space-y-2 text-sm text-gray-600">
                    <div>
                      <span className="font-medium">Duration:</span> 30 minutes
                    </div>
                    <div>
                      <span className="font-medium">Region:</span> us-east-1
                    </div>
                    <div>
                      <span className="font-medium">Service:</span> Amazon EC2
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content - Lab Instructions */}
          <div className="lg:col-span-2">
            <div className="space-y-6">
              {/* Overview Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <BookOpen className="h-5 w-5 text-blue-500" />
                    <span>Overview</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="prose prose-sm max-w-none">
                    <p className="text-gray-700 leading-relaxed">
                      Welcome to AWS Cloud Sandboxes - a dedicated training environment designed to help you learn and
                      practice AWS services in a safe, controlled setting.
                    </p>

                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 my-4">
                      <div className="flex items-start space-x-2">
                        <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <h4 className="font-semibold text-yellow-800 mb-2">Important Notice</h4>
                          <p className="text-yellow-700 text-sm">
                            This environment is <strong>purely for training purposes</strong> and should not be used for
                            your POCs (Proof of Concepts) or demos. Any violation of this policy will be dealt with
                            accordingly and may result in access restrictions.
                          </p>
                        </div>
                      </div>
                    </div>

                    <p className="text-gray-700">
                      Use this sandbox to experiment, learn, and build your AWS skills without affecting production
                      environments or incurring unexpected costs.
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Objective Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Target className="h-5 w-5 text-green-500" />
                    <span>Objective</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700">
                    Create an Amazon EC2 instance with desired configurations following AWS best practices. You will
                    learn how to launch a virtual server in the cloud with specific settings for a typical web
                    application deployment.
                  </p>
                </CardContent>
              </Card>

              {/* Steps Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <List className="h-5 w-5 text-purple-500" />
                    <span>Steps to Create EC2 Instance</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-4">
                    <div className="border-l-4 border-blue-500 pl-4">
                      <h4 className="font-semibold text-gray-900 mb-2">1. Access AWS Console</h4>
                      <p className="text-sm text-gray-600">
                        Use the provided AWS Console URL to access your lab environment.
                      </p>
                    </div>

                    <div className="border-l-4 border-blue-500 pl-4">
                      <h4 className="font-semibold text-gray-900 mb-2">2. Navigate to EC2 Service</h4>
                      <p className="text-sm text-gray-600">
                        Go to Services → Compute → EC2 or search for "EC2" in the search bar.
                      </p>
                    </div>

                    <div className="border-l-4 border-blue-500 pl-4">
                      <h4 className="font-semibold text-gray-900 mb-2">3. Launch Instance</h4>
                      <p className="text-sm text-gray-600">
                        Click "Launch Instance" and configure with the following specifications:
                      </p>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                    <h4 className="font-semibold text-gray-900 mb-3">Required Configurations:</h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="font-medium text-gray-700">Tag Name:</span>
                          <code className="bg-white px-2 py-1 rounded text-xs">{username || "<username>"}</code>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium text-gray-700">Machine Image:</span>
                          <code className="bg-white px-2 py-1 rounded text-xs">Amazon Linux (Free Tier)</code>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium text-gray-700">Instance Type:</span>
                          <code className="bg-white px-2 py-1 rounded text-xs">t2.micro or t3.micro</code>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="font-medium text-gray-700">Key Pair:</span>
                          <code className="bg-white px-2 py-1 rounded text-xs">default</code>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium text-gray-700">VPC:</span>
                          <code className="bg-white px-2 py-1 rounded text-xs">training-L&D</code>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium text-gray-700">Security Group:</span>
                          <code className="bg-white px-2 py-1 rounded text-xs">CS_EC2_Demo1_GLX</code>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="border-l-4 border-blue-500 pl-4">
                    <h4 className="font-semibold text-gray-900 mb-2">4. Review and Launch</h4>
                    <p className="text-sm text-gray-600">
                      Review all configurations and click "Launch Instance" to create your EC2 instance.
                    </p>
                  </div>

                  <div className="border-l-4 border-blue-500 pl-4">
                    <h4 className="font-semibold text-gray-900 mb-2">5. Verify Instance</h4>
                    <p className="text-sm text-gray-600">
                      Check the EC2 dashboard to confirm your instance is running successfully.
                    </p>
                  </div>

                  {labStarted && !taskCompleted && (
                    <div className="pt-4">
                      <Button
                        onClick={handleCheckProgram}
                        disabled={isCheckingProgram}
                        size="lg"
                        className="w-full bg-green-600 hover:bg-green-700"
                      >
                        <Search className="w-4 h-4 mr-2" />
                        {isCheckingProgram ? "Checking Program..." : "Check Program"}
                      </Button>
                    </div>
                  )}

                  {taskCompleted && (
                    <div className="bg-green-50 p-4 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                        <span className="font-medium text-green-800">Program Completed Successfully!</span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Right Panel - Task Progress */}
          <div className="lg:col-span-1">
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle className="text-lg">Task Progress</CardTitle>
                <CardDescription>Complete the lab objective</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-start space-x-3 p-3 rounded-lg border">
                    <Checkbox checked={taskCompleted} disabled className="mt-1" />
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-gray-900">Create EC2 Instance</h4>
                      <p className="text-xs text-gray-500 mt-1">
                        Configure and launch an EC2 instance with the specified requirements
                      </p>
                      {taskCompleted && (
                        <div className="flex items-center space-x-1 mt-2">
                          <CheckCircle2 className="w-3 h-3 text-green-600" />
                          <span className="text-xs text-green-600 font-medium">Completed</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-gray-700">Configuration Checklist</h4>
                  <div className="space-y-1 text-xs text-gray-600">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 rounded-full bg-blue-500" />
                      <span>Tag name: {username || "<username>"}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 rounded-full bg-blue-500" />
                      <span>AMI: Amazon Linux (Free Tier)</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 rounded-full bg-blue-500" />
                      <span>Instance: t2.micro or t3.micro</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 rounded-full bg-blue-500" />
                      <span>Key pair: default</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 rounded-full bg-blue-500" />
                      <span>VPC: training-L&D</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 rounded-full bg-blue-500" />
                      <span>Security Group: CS_EC2_Demo1_GLX</span>
                    </div>
                  </div>
                </div>

                {taskCompleted && (
                  <div className="bg-green-50 p-3 rounded-lg">
                    <h4 className="text-sm font-medium text-green-800 mb-1">🎉 Task Complete!</h4>
                    <p className="text-xs text-green-700">You have successfully created an EC2 instance. Great job!</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
