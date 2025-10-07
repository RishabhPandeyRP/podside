import {configureStore} from "@reduxjs/toolkit";
import userSlice from "./userSlice";

export const makeStore = () => configureStore({
    reducer: {
        user: userSlice,
    },
});

export type AppStore = ReturnType<typeof makeStore>;
export type AppState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];