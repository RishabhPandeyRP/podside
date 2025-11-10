import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { ReactNode } from "react";

export interface SideBarState {
    isOpen?: boolean;
    type: "profile" | "conference"| null;
    data?: any;
}

const initialState: SideBarState = {
    isOpen: false,
    type: null,
    data:null,
};

const sideBarSlice = createSlice({
    name: "sideBar",
    initialState,
    reducers: {
        openSidebar: (state, action: PayloadAction<SideBarState>) => {
            state.isOpen = true;
            state.type = action.payload.type;
            state.data = action.payload.data;
        },
        closeSidebar: (state) => {
            state.isOpen = false;
            state.type = null;
            state.data = null;
        },
    },
});

export const { openSidebar, closeSidebar } = sideBarSlice.actions;
export default sideBarSlice.reducer;