import { writeSync } from "fs";
import { Key } from "ink";
import { Dispatch, SetStateAction } from "react";

export function exitError(exit: (error?: Error) => void, error: Error) {
  process.exitCode = 1;
  exit();
  setTimeout(() => {
    writeSync(2, `\n${error.message}\n`);
    process.exit(1);
  }, 50);
}

export function sidebarItemInputHandler(
  key: Key,
  hoverIndex: number,
  setHoverIndex: Dispatch<SetStateAction<number>>,
  onReturn: (selectedIndex: number) => void,
  items: any[]
) {
  if (key.upArrow) {
    setHoverIndex((prev) => {
      if (prev > 0) {
        return prev - 1;
      } else {
        return items ? items.length - 1 : 0;
      }
    });
  }
  if (key.downArrow) {
    setHoverIndex((prev) => {
      if (prev + 1 < (items?.length ?? 0)) {
        return prev + 1;
      } else {
        return 0;
      }
    });
  }
  if (key.return) {
    onReturn(hoverIndex);
  }
}
