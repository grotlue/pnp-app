import {
  CSP_CONNECT_SRC_BASE,
  CSP_FRAME_SRC_BASE,
  CSP_SCRIPT_SRC_BASE,
  CSP_TOOLBAR_ORIGIN,
  SECURITY_HEADER_VALUES,
} from "./constants";

const buildContentSecurityPolicy = (toolbarEnabled: boolean): string => {
  const scriptSrc: string[] = [...CSP_SCRIPT_SRC_BASE];
  const connectSrc: string[] = [...CSP_CONNECT_SRC_BASE];
  const frameSrc: string[] = [...CSP_FRAME_SRC_BASE];

  if (toolbarEnabled) {
    scriptSrc.push(CSP_TOOLBAR_ORIGIN);
    connectSrc.push(CSP_TOOLBAR_ORIGIN);
    frameSrc.push(CSP_TOOLBAR_ORIGIN);
  }

  return [
    `default-src ${SECURITY_HEADER_VALUES.defaultSrc}`,
    `script-src ${scriptSrc.join(" ")}`,
    `style-src ${SECURITY_HEADER_VALUES.styleSrc}`,
    `img-src ${SECURITY_HEADER_VALUES.imgSrc}`,
    `font-src ${SECURITY_HEADER_VALUES.fontSrc}`,
    `connect-src ${connectSrc.join(" ")}`,
    `frame-src ${frameSrc.join(" ")}`,
    `frame-ancestors ${SECURITY_HEADER_VALUES.frameAncestors}`,
    `base-uri ${SECURITY_HEADER_VALUES.baseUri}`,
    `form-action ${SECURITY_HEADER_VALUES.formAction}`,
  ].join("; ");
};

export { buildContentSecurityPolicy as default, buildContentSecurityPolicy };
