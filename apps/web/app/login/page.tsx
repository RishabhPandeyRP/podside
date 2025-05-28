"use client";
import React, { useEffect } from "react";
import { cn } from "../../lib/util";
import { FcGoogle } from "react-icons/fc";
import { useRouter } from "next/navigation";

import Cookies from "js-cookie";
export default function LoginPage() {
  const router = useRouter();
  const handleGoogleLogin = async () => {
    try {
      window.location.href = `${process.env.NEXT_PUBLIC_SERVER_URL}/auth/google`;
    } catch (error) {
      console.log("Error in signing with google", error);
    }
  };

  useEffect(() => {
    const token = Cookies.get("token");
    console.log("token", token);
    if (token) {
      router.push("/");
    }
  }, []);

  return (
    <div
      className={cn(
        "absolute inset-0",
        "[background-size:40px_40px]",
        "[background-image:linear-gradient(to_right,#e4e4e7_1px,transparent_1px),linear-gradient(to_bottom,#e4e4e7_1px,transparent_1px)]",
        "dark:[background-image:linear-gradient(to_right,#262626_1px,transparent_1px),linear-gradient(to_bottom,#262626_1px,transparent_1px)]",
        "h-fit border-0 pt-16 sm:pt-20 md:pt-24 lg:pt-[8%] relative"
      )}
    >
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-white [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)] dark:bg-black z-0"></div>

      <div className="relative z-10">
        <div className="mx-auto w-full px-4 sm:px-6 md:w-4/5 lg:w-3/4 xl:w-[55%] min-h-[400px] sm:min-h-[500px] md:min-h-[600px] text-3xl sm:text-4xl md:text-5xl lg:text-[60px] text-center font-bold flex flex-col justify-center items-center gap-0 mb-8 sm:mb-12 md:mb-16 lg:mb-[70px]">
          <div className="w-full max-w-md">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-white mb-3">Welcome</h1>
              <p className="text-gray-400 text-lg">Sign in to continue</p>
            </div>

            <div className="flex flex-col gap-3">
              <button
                onClick={handleGoogleLogin}
                className="w-full flex items-center cursor-pointer justify-center gap-4 bg-white text-gray-900 font-semibold py-4 px-6 rounded-lg hover:bg-gray-50 transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg group"
              >
                <span className="text-lg">Continue as Guest</span>
              </button>
              <button
                onClick={handleGoogleLogin}
                className="w-full flex items-center cursor-pointer justify-center gap-4 bg-white text-gray-900 font-semibold py-4 px-6 rounded-lg hover:bg-gray-50 transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg group"
              >
                <FcGoogle className="text-2xl" />
                <span className="text-lg">Continue with Google</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
