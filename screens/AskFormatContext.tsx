import React, { createContext, useContext } from "react";




export const AskFormatContext =
    createContext<AskFormatContextType | null>(null);

export const useAskFormat = () => {
    const ctx = useContext(AskFormatContext);
    if (!ctx) throw new Error("useAskFormat must be used inside provider");
    return ctx;
};
