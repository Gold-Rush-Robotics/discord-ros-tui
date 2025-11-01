import { Text } from "ink";
import React, { useEffect, useState } from "react";

function LoadingDots() {
  const [dots, setDots] = useState<string>("");

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => {
        if (prev === "...") {
          return "";
        }

        return prev + ".";
      });
    }, 250);
    return () => clearInterval(interval);
  }, [dots]);

  return <Text>{dots}</Text>;
}

export default LoadingDots;
