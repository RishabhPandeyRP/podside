import React, { useEffect, useState } from "react";
import { useAppSelector } from "../lib/hooks";
import { apiRequest } from "../lib/api";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import { useAppDispatch } from "../lib/hooks";
import { clearUser, setUser } from "../lib/userSlice";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { openSidebar } from "../lib/sideBarSlice";
import { closeSidebar } from "../lib/sideBarSlice";

const NavBar =  ()=>{
    const user = useAppSelector((state) => state.user);
    const {isOpen} = useAppSelector((state:any) => state.sideBar);
    const pathname = usePathname();
    const router = useRouter();
    const dispatch = useAppDispatch();
    const [loggingOut, setLoggingOut] = React.useState(false);
    console.log("User in NavBar:", user);
    const linkMapping = [{
        href:"/create-room", label:"Create Room"
    },{href:"test", label:"Test"}];

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
    // const router = useRouter();
    const [loading, setLoading] = useState(false);

    // const dispatch = useAppDispatch();
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

    const handleOpen = ()=>{
        console.log("Opening sidebar with user profile");
        if(isOpen) dispatch(closeSidebar());
        else dispatch(openSidebar({type:"profile", data:{email: user.email}}));
    }

    return(
        <div className="relative border-0 border-red-600 h-20 flex items-center px-10 bg-[#121212] justify-between w-full z-0">
            {/* <div className="absolute inset bottom-0 left-0 w-full h-1 bg-gradient-to-b from-white/90 to-white/0 blur-md pointer-events-none"></div> */}
            <Link href="/">
                <div className="text-white font-bold text-2xl border-0">PodSide</div>
            </Link>

            <div className="text-white border-0">
                <ul>
                    {
                        linkMapping.map((link)=>(
                            <Link key={link.href} href={link.href}>
                                <li className={`inline-block mx-4 cursor-pointer hover:text-[#9966cce5] ${pathname === link.href ? "text-[#9966cce5]" : ""}`}>
                                    {link.label}
                                </li>
                            </Link>
                        ))
                    }
                </ul>

            </div>

            {/* username and profile icon on the right */}
            {
                user?.email ? <div className=" right-10 flex items-center gap-4">
                    <div className="text-white">Username</div>
                    <div className="w-8 h-8 rounded-full bg-gray-500 flex items-center justify-center text-white font-bold cursor-pointer" onClick={handleOpen}>
                        {user.email ? user.email.charAt(0).toUpperCase() : "U"}
                        
                    </div>
                    <button className="px-4 py-2 bg-[#9966CC] rounded hover:bg-[#9966cce5]" onClick={logoutHandler}>
                        {loggingOut ? "Logging out..." : "Logout"}
                    </button>
                </div>
                : <div className=" right-10 text-white flex gap-4 ">
                    <button className="px-4 py-2 bg-[#9966CC] rounded hover:bg-[#9966cce5]" onClick={()=>{
                        router.push("/signup");
                    }}>
                        SignUp
                    </button>

                    <button className="px-4 py-2 bg-[#9966CC] rounded hover:bg-[#9966cce5]" onClick={()=>{
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