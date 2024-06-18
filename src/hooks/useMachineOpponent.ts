import { useEffect, useState } from "react";
import { GetPlayerActionsFunction } from "../types";

export default function useMachineOpponent(loadPlayer: () => Promise<GetPlayerActionsFunction>) {
  const [status, setStatus] = useState<"loading" | "error" | "success">("loading");
  const [getPlayerActionsFunction, setGetPlayerActionsFunction] = useState<GetPlayerActionsFunction | null>(null);

  useEffect(() => {
    let mounted = true;
    setStatus("loading");
    loadPlayer()
      .then((cb) => {
        if (mounted) {
          setStatus("success");
          setGetPlayerActionsFunction(() => cb);
        }
      })
      .catch((err) => {
        if (mounted) {
          console.error(err);
          setStatus("error");
        }
      });
    return () => {
      mounted = false;
    };
  }, [loadPlayer]);

  return { status, getComputerActions: getPlayerActionsFunction ?? (() => ({ buttonPressed: false, paddleDirection: 0 })) };
}
