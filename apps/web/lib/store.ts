import {configureStore} from "@reduxjs/toolkit";
import userSlice from "./userSlice";
import sideBarSlice from "./sideBarSlice";

export const makeStore = () => configureStore({
    reducer: {
        user: userSlice,
        sideBar: sideBarSlice,
    },
});

export type AppStore = ReturnType<typeof makeStore>;
export type AppState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];