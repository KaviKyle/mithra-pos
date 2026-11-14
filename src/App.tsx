import { useState, useEffect, useCallback } from "react";
import { Toaster } from "react-hot-toast";
import { HomeScreen } from "./components/HomeScreen";
import { SellScreen } from "./components/SellScreen";
import { Screen } from "./types";

/**
 * App Router — simple screen switcher.
 * No React Router needed — this is a single-screen kiosk app.
 * Keyboard shortcuts are global and work from any screen.
 */
export default function App() {
  const [screen, setScreen] = useState<Screen>("home");
  const [todaySalesCount, setTodaySalesCount] = useState(0);
  const [hasReorderItems, setHasReorderItems] = useState(false);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if modal/input is focused
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") return;

      switch (e.key) {
        case "F1":
          e.preventDefault();
          setScreen("sell");
          break;
        case "F2":
          e.preventDefault();
          setScreen("stock");
          break;
        case "F6":
          e.preventDefault();
          setScreen("dayClose");
          break;
        case "Escape":
          if (screen !== "home") {
            e.preventDefault();
            setScreen("home");
          }
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [screen]);

  const navigateTo = useCallback((s: Screen) => setScreen(s), []);
  const goHome = useCallback(() => setScreen("home"), []);

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 2000,
          style: {
            fontSize: "16px",
            padding: "12px 20px",
            borderRadius: "12px",
          },
        }}
      />

      {screen === "home" && (
        <HomeScreen
          onNavigate={navigateTo}
          todaySalesCount={todaySalesCount}
          hasReorderItems={hasReorderItems}
        />
      )}

      {screen === "sell" && <SellScreen onBack={goHome} />}

      {screen === "stock" && (
        <div className="screen flex flex-col items-center justify-center gap-4">
          <h1 className="text-2xl font-bold">Stock</h1>
          <p className="text-gray-500">මෙම screen තවම නිර්මාණය කර නැත.</p>
          <button onClick={goHome} className="btn-primary">ආපසු</button>
        </div>
      )}

      {screen === "stockCount" && (
        <div className="screen flex flex-col items-center justify-center gap-4">
          <h1 className="text-2xl font-bold">Stock Count</h1>
          <p className="text-gray-500">මෙම screen තවම නිර්මාණය කර නැත.</p>
          <button onClick={goHome} className="btn-primary">ආපසු</button>
        </div>
      )}

      {screen === "addProduct" && (
        <div className="screen flex flex-col items-center justify-center gap-4">
          <h1 className="text-2xl font-bold">Add Product</h1>
          <p className="text-gray-500">මෙම screen තවම නිර්මාණය කර නැත.</p>
          <button onClick={goHome} className="btn-primary">ආපසු</button>
        </div>
      )}

      {screen === "dayClose" && (
        <div className="screen flex flex-col items-center justify-center gap-4">
          <h1 className="text-2xl font-bold">Day Close</h1>
          <p className="text-gray-500">මෙම screen තවම නිර්මාණය කර නැත.</p>
          <button onClick={goHome} className="btn-primary">ආපසු</button>
        </div>
      )}
    </div>
  );
}
