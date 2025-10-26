"use client";
import React, { FormEvent, useEffect, useState } from "react";
import { cn } from "../../lib/util";
import { FcGoogle } from "react-icons/fc";
import { useRouter } from "next/navigation";
import { useAppDispatch } from "../../lib/hooks";
import { setUser } from "../../lib/userSlice";
import { apiRequest } from "../../lib/api";
import { toast } from "react-toastify";

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: "rishabh177044@gmail.com",
    password: "abcd123"
  });
  const [loading, setLoading] = useState(false);
  const dispatch = useAppDispatch();
  const handleGoogleLogin = async () => {
    try {
      console.log("url is :" , `${process.env.NEXT_PUBLIC_SERVER_URL}/auth/google`)
      window.location.href = `${process.env.NEXT_PUBLIC_SERVER_URL}/auth/google`;
    } catch (error) {
      console.log("Error in signing with google", error);
    }
  };

  const handleFormSubmit = async (e:FormEvent) => {
    e.preventDefault();
    try {
      // Add your login logic here
      setLoading(true);
      console.log("Login form submitted:", formData);
      const response = await apiRequest('/user/login', 'POST', formData);
      console.log("Login response:", response);
      dispatch(setUser(response.user));
      router.push("/");
    } catch (error) {
      console.log("Error in form login", error);
      toast.error(error instanceof Error ? error.message : "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e:React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

   useEffect(() => {
    const checkSession = async () => {
      setLoading(true);
      try {
        const response = await apiRequest("/user/me", "GET");
        console.log("Session check response:", response);
        if (response?.user) {
          dispatch(setUser(response.user));
          if (window.location.pathname !== "/") router.push("/");
        }
      } catch {
        // not logged in, stay on login page
      } finally {
        setLoading(false);
      }
    };
    checkSession();
  }, [dispatch, router]);

  return (
    <div
      className={cn(
        "absolute inset-0",
        "[background-size:40px_40px]",
        "[background-image:linear-gradient(to_right,#e4e4e7_1px,transparent_1px),linear-gradient(to_bottom,#e4e4e7_1px,transparent_1px)]",
        "dark:[background-image:linear-gradient(to_right,#262626_1px,transparent_1px),linear-gradient(to_bottom,#262626_1px,transparent_1px)]",
        "h-fit border-1 pt-16 sm:pt-20 md:pt-24 lg:pt-[8%] relative"
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

            <div className="flex flex-col gap-6">
              {/* Login Form */}
              <form onSubmit={handleFormSubmit} className="flex flex-col gap-3">
                <div className="flex flex-col gap-3">
                  <input
                    type="email"
                    name="email"
                    placeholder="Enter your email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className="w-full py-3 px-4 rounded-lg bg-white text-gray-900 placeholder-gray-500 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 text-sm"
                  />
                  <input
                    type="password"
                    name="password"
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                    className="w-full py-3 px-4 rounded-lg bg-white text-gray-900 placeholder-gray-500 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 text-sm"
                  />
                </div>
                
                <button
                  type="submit"
                  className="w-full bg-blue-600 text-white font-medium py-3 px-4 rounded-lg hover:bg-blue-700 transition-all duration-300 transform hover:scale-[1.01] hover:shadow-md text-sm"
                >
                  {loading ? "Signing in...":"Sign In"}
                </button>
              </form>

              {/* Divider */}
              <div className="flex items-center gap-4">
                <div className="flex-1 h-px bg-gray-600"></div>
                <span className="text-gray-400 text-sm">or</span>
                <div className="flex-1 h-px bg-gray-600"></div>
              </div>

              {/* OAuth Buttons */}
              <div className="flex flex-col gap-3">
                <button
                  onClick={handleGoogleLogin}
                  className="w-full flex items-center cursor-pointer justify-center gap-3 bg-white text-gray-900 font-medium py-3 px-4 rounded-lg hover:bg-gray-50 transition-all duration-300 transform hover:scale-[1.01] hover:shadow-md group text-sm"
                >
                  <span>Continue as Guest</span>
                </button>
                <button
                  onClick={handleGoogleLogin}
                  className="w-full flex items-center cursor-pointer justify-center gap-3 bg-white text-gray-900 font-medium py-3 px-4 rounded-lg hover:bg-gray-50 transition-all duration-300 transform hover:scale-[1.01] hover:shadow-md group text-sm"
                >
                  <FcGoogle className="text-xl" />
                  <span>Continue with Google</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}