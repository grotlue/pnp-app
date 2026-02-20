import { BOOLEAN_ENV_VALUES, NODE_ENV_VALUES } from "./constants";

const resolveVercelToolbarEnabled = (): boolean => {
  return (
    process.env.NODE_ENV === NODE_ENV_VALUES.development ||
    process.env.NEXT_PUBLIC_ENABLE_VERCEL_TOOLBAR === BOOLEAN_ENV_VALUES.true
  );
};

export { resolveVercelToolbarEnabled as default, resolveVercelToolbarEnabled };
