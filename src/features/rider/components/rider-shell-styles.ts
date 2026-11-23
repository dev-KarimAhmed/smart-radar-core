export const styles = {
  root: 'flex min-h-dvh w-full flex-col bg-[#0A0F1D] text-white lg:h-screen lg:overflow-hidden',
  rootStandby: 'h-dvh overflow-hidden',
  header: 'sticky top-0 z-[100] w-full shrink-0 lg:hidden',
  main: 'relative flex w-full flex-1 flex-col overflow-y-visible lg:h-screen lg:min-h-0 lg:overflow-hidden',
  mainShifted: 'lg:ps-[288px]',
  mainStandby: 'min-h-0 flex-1 w-full overflow-hidden flex flex-col justify-center items-center lg:h-full',
  adStage: 'relative z-[80] flex min-h-0 w-full flex-1 flex-col justify-center items-center overflow-hidden lg:h-full',
  content: 'w-full flex-1 p-4 md:p-8',
  contentHome: 'p-0 md:p-0 lg:p-0',
  contentInner: 'min-h-0 overflow-y-auto scrollbar-thin px-0 py-4 md:px-0 md:py-6',
  contentHidden: 'hidden',
  footer: 'sticky bottom-0 z-[100] w-full shrink-0 lg:hidden',
} as const;

export const CRITICAL_RIDER_STATES = ['searching', 'busy', 'rating', 'checkpoint_required'];
