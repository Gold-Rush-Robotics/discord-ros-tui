import React, { createContext, ReactNode, useContext, useState } from "react";

export type FocusTarget = "command-input" | "topics" | "carousel";

interface FocusManagerContextValue {
  currentFocus: FocusTarget;
  setFocus: (target: FocusTarget) => void;
  isFocused: (target: FocusTarget) => boolean;
  carouselIndex: number;
  setCarouselIndex: (index: number | ((prev: number) => number)) => void;
  isCarouselItemActive: (id: string) => boolean;
  focusCarouselItem: (id: string) => void;
}

const FocusManagerContext = createContext<FocusManagerContextValue | null>(
  null
);

// Carousel IDs - keep in sync with MainContent
const CAROUSEL_IDS = ["node", "packages", "services"] as const;

function getCarouselIndexFromId(id: string): number {
  return CAROUSEL_IDS.indexOf(id as (typeof CAROUSEL_IDS)[number]);
}

export function FocusManagerProvider({ children }: { children: ReactNode }) {
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [currentFocus, setCurrentFocus] =
    useState<FocusTarget>("command-input");

  function isFocused(target: FocusTarget): boolean {
    return currentFocus === target;
  }

  function isCarouselItemActive(id: string): boolean {
    return (
      currentFocus === "carousel" &&
      getCarouselIndexFromId(id) === carouselIndex
    );
  }

  function focusCarouselItem(id: string): void {
    const index = getCarouselIndexFromId(id);
    if (index !== -1) {
      setCarouselIndex(index);
      setCurrentFocus("carousel");
    }
  }

  const value: FocusManagerContextValue = {
    currentFocus,
    setFocus: setCurrentFocus,
    isFocused,
    carouselIndex,
    setCarouselIndex,
    isCarouselItemActive,
    focusCarouselItem,
  };

  return (
    <FocusManagerContext.Provider value={value}>
      {children}
    </FocusManagerContext.Provider>
  );
}

export function useFocusManager(): FocusManagerContextValue {
  const context = useContext(FocusManagerContext);
  if (!context) {
    throw new Error("useFocusManager must be used within FocusManagerProvider");
  }
  return context;
}
