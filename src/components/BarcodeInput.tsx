import { useState, useRef, useEffect, KeyboardEvent } from "react";
import { Product } from "../types";
import { searchProducts, getProductByBarcode } from "../lib/supabase";

interface BarcodeInputProps {
  onProductSelect: (product: Product) => void;
  disabled?: boolean;
}

export function BarcodeInput({ onProductSelect, disabled }: BarcodeInputProps) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Product[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  // Auto-focus barcode input, BUT skip if modal is open or another input is focused
  useEffect(() => {
    const handleClick = () => {
      if (disabled) return;
      if (!inputRef.current) return;

      // Don't steal focus if a modal is open
      const modalOpen = document.querySelector('[data-modal="true"]');
      if (modalOpen) return;

      // Don't steal focus if another input/textarea/button is focused
      const active = document.activeElement;
      if (
        active &&
        (active.tagName === "INPUT" ||
          active.tagName === "TEXTAREA" ||
          active.tagName === "BUTTON")
      ) {
        return;
      }

      inputRef.current.focus();
    };

    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [disabled]);

  // Focus on mount if nothing else is focused
  useEffect(() => {
    if (disabled) return;
    if (!inputRef.current) return;
    if (document.activeElement && document.activeElement.tagName === "INPUT") return;
    inputRef.current.focus();
  }, [disabled]);

  const handleInputChange = async (value: string) => {
    setQuery(value);
    setSuggestions([]);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (value.length < 2) return;

    debounceRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const byBarcode = await getProductByBarcode(value);
        if (byBarcode) {
          onProductSelect(byBarcode);
          setQuery("");
          setIsSearching(false);
          return;
        }
        const results = await searchProducts(value);
        setSuggestions(results);
      } catch (err) {
        console.error("Search error:", err);
      } finally {
        setIsSearching(false);
      }
    }, 150);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && suggestions.length > 0) {
      onProductSelect(suggestions[0]);
      setQuery("");
      setSuggestions([]);
    }
  };

  const handleSuggestionClick = (product: Product) => {
    onProductSelect(product);
    setQuery("");
    setSuggestions([]);
  };

  return (
    <div className="relative w-full">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => handleInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder="බාර්කෝඩ් ස්කෑන් කරන්න හෝ නම type කරන්න..."
          className="w-full h-14 px-4 pr-12 text-lg border-2 border-gray-300 rounded-xl 
                     focus:border-black focus:ring-2 focus:ring-black focus:ring-offset-2
                     disabled:bg-gray-100 disabled:text-gray-400"
        />
        {isSearching && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            <div className="w-5 h-5 border-2 border-gray-300 border-t-black rounded-full animate-spin" />
          </div>
        )}
      </div>

      {suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-72 overflow-auto">
          {suggestions.map((product) => (
            <button
              key={product.id}
              onClick={() => handleSuggestionClick(product)}
              className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-0
                         flex items-center justify-between"
            >
              <div>
                <span className="font-medium text-gray-900">{product.name}</span>
                <span className="si-label">{product.category} · Stock: {product.stockQty}</span>
              </div>
              <span className="text-lg font-semibold tabular">Rs. {product.sellPrice.toLocaleString()}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}