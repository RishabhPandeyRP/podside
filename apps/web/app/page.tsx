"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "../lib/util";
import { Hero } from "../components/Hero";
import { useAppDispatch } from "../lib/hooks";
import { apiRequest } from "../lib/api";
import { setUser } from "../lib/userSlice";

export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const dispatch = useAppDispatch();
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
      {/* Background overlay with lower z-index */}
      {/* <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-white [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)] dark:bg-black z-0"></div> */}

      {/* Content with higher z-index */}
      <div className="relative z-10">
        <div className="mx-auto w-full px-4 sm:px-6 md:w-4/5 lg:w-3/4 xl:w-[55%] min-h-[400px] sm:min-h-[500px] md:min-h-[600px] text-3xl sm:text-4xl md:text-5xl lg:text-[60px] text-center font-bold flex flex-col justify-center items-center gap-0 mb-8 sm:mb-12 md:mb-16 lg:mb-[70px]">
          <Hero></Hero>

          <div className="text-base sm:text-lg md:text-xl lg:text-[20px] font-light text-neutral-500 w-full sm:w-[95%] md:w-[90%] text-center mb-4 sm:mb-[3%] md:mb-[5%]">
            Seamlessly transforming ideas into immersive digital experiences
            that captivate users and drive business growth.
          </div>
        </div>
      </div>
    </div>
  );
}
