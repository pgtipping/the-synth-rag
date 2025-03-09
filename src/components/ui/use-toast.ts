import * as React from "react";

const TOAST_LIMIT = 1;

type ToastProps = {
  title?: string;
  description?: string;
  variant?: "default" | "destructive";
};

type Toast = {
  id: string;
  title?: string;
  description?: string;
  variant?: "default" | "destructive";
};

let count = 0;

function genId() {
  count = (count + 1) % Number.MAX_VALUE;
  return count.toString();
}

type State = {
  toasts: Toast[];
};

type Action =
  | {
      type: "ADD_TOAST";
      toast: Toast;
    }
  | {
      type: "REMOVE_TOAST";
      toastId?: string;
    };

// const addToRemoveQueue = (toastId: string) => {
//   if (toastTimeouts.has(toastId)) {
//     return;
//   }

//   const timeout = setTimeout(() => {
//     toastTimeouts.delete(toastId);
//     dispatch({
//       type: "REMOVE_TOAST",
//       toastId: toastId,
//     });
//   }, TOAST_REMOVE_DELAY);

//   toastTimeouts.set(toastId, timeout);
// };

export const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case "ADD_TOAST":
      return {
        ...state,
        toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT),
      };

    case "REMOVE_TOAST":
      if (action.toastId === undefined) {
        return {
          ...state,
          toasts: [],
        };
      }
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.toastId),
      };
  }
};

const listeners: Array<(state: State) => void> = [];

let memoryState: State = { toasts: [] };

function dispatch(action: Action) {
  memoryState = reducer(memoryState, action);
  listeners.forEach((listener) => {
    listener(memoryState);
  });
}

export function toast({ ...props }: ToastProps) {
  const id = genId();

  const update = (props: ToastProps) =>
    dispatch({
      type: "ADD_TOAST",
      toast: {
        ...props,
        id,
      },
    });
  const dismiss = () => dispatch({ type: "REMOVE_TOAST", toastId: id });

  dispatch({
    type: "ADD_TOAST",
    toast: {
      ...props,
      id,
    },
  });

  return {
    id: id,
    dismiss,
    update,
  };
}

export function useToast() {
  const [state, setState] = React.useState<State>(memoryState);

  React.useEffect(() => {
    listeners.push(setState);
    return () => {
      const index = listeners.indexOf(setState);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    };
  }, [state]);

  return {
    toast,
    dismiss: (toastId?: string) => dispatch({ type: "REMOVE_TOAST", toastId }),
  };
}
