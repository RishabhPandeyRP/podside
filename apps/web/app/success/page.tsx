"use client";
import { cn } from "../../lib/util";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Cookies from "js-cookie";

export default function success() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [timer, setTimer] = useState(10);

  let timeCounter: NodeJS.Timeout | null = null;

  useEffect(() => {
    const token = searchParams.get("token");
    const user = searchParams.get("user");
    if (!token || !user) {
      router.push("/login");
      return;
    }
    Cookies.set("token", token);
    Cookies.set("user", user);

    if (timeCounter) clearTimeout(timeCounter);
    let interval = setInterval(() => {
      setTimer((prev: number) => {
        if (prev <= 1) {
          clearInterval(interval);
          router.push("/");
        }
        return prev - 1;
      });
    }, 1000);
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
      {/* Background overlay with lower z-index */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-white [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)] dark:bg-black z-0"></div>

      {/* Content with higher z-index */}
      <div className="relative z-10">
        <div className="mx-auto w-full px-4 sm:px-6 md:w-4/5 lg:w-3/4 xl:w-[55%] min-h-[400px] sm:min-h-[500px] md:min-h-[600px] text-3xl sm:text-4xl md:text-5xl lg:text-[60px] text-center font-bold flex flex-col justify-center items-center gap-0 mb-8 sm:mb-12 md:mb-16 lg:mb-[70px]">
          Authentication Successfull. Redirecting in {timer} seconds.
        </div>
      </div>
    </div>
  );
}
