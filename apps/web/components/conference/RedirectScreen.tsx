import { CheckCircle } from "lucide-react";
import React from "react";

interface RedierctScreenInterface {
    redirectCountdown: number;
    setRedirectCountdown: React.Dispatch<React.SetStateAction<number>>;
}
const RedirectScreen = ({ redirectCountdown, setRedirectCountdown }: RedierctScreenInterface) => {
    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full mb-6">
                    <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
                </div>

                <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
                    Meeting Ended
                </h1>

                <p className="text-gray-600 dark:text-gray-400 mb-6">
                    You have successfully left the meeting room.
                </p>

                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 mb-6">
                    <p className="text-green-700 dark:text-green-300 font-medium mb-2">
                        Redirecting to homepage...
                    </p>
                    <div className="flex items-center justify-center gap-3">
                        <div className="w-8 h-8 border-3 border-green-600 border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                            {redirectCountdown}
                        </span>
                    </div>
                </div>

                <button
                    onClick={() => window.location.href = '/'}
                    className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                    Go to Home Now
                </button>
            </div>
        </div>
    )
}

export default RedirectScreen