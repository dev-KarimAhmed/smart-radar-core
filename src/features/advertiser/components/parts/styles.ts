import { portalStyles } from "./styles-portal";
import { campaignStyles } from "./styles-campaign";

export const styles = {
  ...portalStyles,
  ...campaignStyles,
} as const;
