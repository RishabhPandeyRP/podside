import React from "react";
import { useAppSelector } from "../lib/hooks";
import { apiRequest } from "../lib/api";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import { useAppDispatch } from "../lib/hooks";
import { clearUser } from "../lib/userSlice";

const NavBar =  ()=>{
    const user = useAppSelector((state) => state.user);
    const router = useRouter();
    const dispatch = useAppDispatch();
    const [loggingOut, setLoggingOut] = React.useState(false);
    console.log("User in NavBar:", user);

    const logoutHandler = async ()=>{
        try {
            setLoggingOut(true);
            const response = await apiRequest("/user/logout", "POST" , {userId: user.id});
            console.log("Logout response:", response);
            dispatch(clearUser());
            router.push("/login");
            toast.success("Logged out successfully");
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "An unexpected error occurred");
        } finally {
            setLoggingOut(false);
        }
    }

    // const testFunc = async ()=>{
    //     console.log("Test function triggered");
    //     try {
    //         const response = await apiRequest("/user/metoo", "GET");
    //     } catch (error) {
    //         toast.error(error instanceof Error ? error.message : "An unexpected error occurred");
    //     }
        
    // }

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
                    <button className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-700" onClick={logoutHandler}>
                        {loggingOut ? "Logging out..." : "Logout"}
                    </button>
                </div>
                : <div className="absolute right-10 text-white flex gap-4 ">
                    <button className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-700" onClick={()=>{
                        router.push("/signup");
                    }}>
                        SignUp
                    </button>

                    <button className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-700" onClick={()=>{
                       router.push("/login");
                    }}>
                        Login
                    </button>


                </div>
            }
        </div>
    )
}

export default NavBar;