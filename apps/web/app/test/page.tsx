"use client"
import RedirectScreen from "../../components/conference/RedirectScreen";
import ValidationScreen from "../../components/conference/ValidationScreen";
const Test = ()=>{
    return(
        <div>
            {/* <ValidationScreen roomIdUrl="sample-room-id-12345"/> */}
            <RedirectScreen redirectCountdown={5} isLeaving={false} setRedirectCountdown={()=>{}}/>
        </div>
    )
}

export default Test;