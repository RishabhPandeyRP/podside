import React from "react";
import { useAppSelector } from "../lib/hooks";

const NavBar = ()=>{
    const user = useAppSelector((state) => state.user);
    console.log("User in NavBar:", user);
    return(
        <div className="relative border-0 border-red-600 h-20 flex items-center px-10 bg-[#121212] ">
            <div className="absolute inset bottom-0 left-0 w-full h-1 bg-gradient-to-b from-white/90 to-white/0 blur-md pointer-events-none"></div>
            <div className="text-white font-bold text-2xl">PodSide</div>

            {/* username and profile icon on the right */}
            {
                user?.email ? <div className="absolute right-10 flex items-center gap-4">
                    <div className="text-white">Username</div>
                    <div className="w-8 h-8 rounded-full bg-gray-500 flex items-center justify-center text-white font-bold">
                        {user.email ? user.email.charAt(0).toUpperCase() : "U"}
                    </div>
                </div>
                : <div className="absolute right-10 text-white">Not logged in</div>
            }
        </div>
    )
}

export default NavBar;