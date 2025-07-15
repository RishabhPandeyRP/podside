import React from "react"
import { Mail, Video, Shield, CheckCircle, XCircle, Loader2 } from "lucide-react";

interface ValidationState {
  validationError: string;
  roomIdUrl?: string | string[];
}

const ErrorValidationScreen = ({validationError,roomIdUrl}:ValidationState) => {
    return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full mb-6">
                    <XCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
                </div>

                <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
                    Room Access Denied
                </h1>

                <p className="text-gray-600 dark:text-gray-400 mb-6">
                    {validationError || "This room is not accessible or may have expired."}
                </p>

                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 mb-6">
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                        Room ID: <span className="font-mono text-red-600 dark:text-red-400">{roomIdUrl}</span>
                    </p>
                </div>

                <button
                    onClick={() => window.location.href = '/'}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                    Go to Home
                </button>
            </div>
        </div>
    )
}

export default ErrorValidationScreen