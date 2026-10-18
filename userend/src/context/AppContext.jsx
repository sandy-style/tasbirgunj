import { createContext, useContext } from "react";

const AppContext = createContext(null);

export const AppProvider = ({ children }) => {
  const value = {
    theme: "light",
    isDark: false,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

// Access the shared app state from any component.
export const useApp = () => {
  const context = useContext(AppContext);

  if (!context) {
    throw new Error("useApp must be used inside an AppProvider");
  }

  return context;
};
