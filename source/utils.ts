import { writeSync } from "fs";

export function exitError(exit: (error?: Error) => void, error: Error): void {
  process.exitCode = 1;
  exit();
  setTimeout(() => {
    writeSync(2, `\n${error.message}\n`);
    process.exit(1);
  }, 50);
}
