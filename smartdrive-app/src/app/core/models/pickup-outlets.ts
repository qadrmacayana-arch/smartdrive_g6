export const SMARTDRIVE_PICKUP_OUTLETS = [
  'Demo SmartDrive Outlet - Makati, Metro Manila',
  'Demo SmartDrive Outlet - Cebu City, Cebu',
  'Demo SmartDrive Outlet - Davao City, Davao del Sur',
] as const;

export function isSmartDrivePickupOutlet(value: string): boolean {
  return (SMARTDRIVE_PICKUP_OUTLETS as readonly string[]).includes(value);
}
