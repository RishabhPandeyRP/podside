import React from "react"
import { Mail, Video, Shield, CheckCircle, XCircle, Loader2 } from "lucide-react";


interface RoomParams {
  roomIdUrl?: string | string[];
}


const ValidationScreen = ({roomIdUrl}:RoomParams) => {
    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full mb-6">
                    <Shield className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                </div>

                <div className="flex items-center justify-center gap-3 mb-4">
                    <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                    <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                        Validating Room
                    </h1>
                </div>

                <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Please wait while we verify the meeting room...
                </p>

                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                        Room ID: <span className="font-mono text-blue-600 dark:text-blue-400">{roomIdUrl}</span>
                    </p>
                </div>
            </div>
        </div>
    )
}

export default ValidationScreen