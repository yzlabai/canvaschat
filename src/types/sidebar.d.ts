import { Brand, Nav, Social, Account, Library } from "@/types/base";

export interface Sidebar {
  disabled?: boolean;
  brand?: Brand;
  nav?: Nav;
  library?: Library;
  social?: Social;
  account?: Account;
  bottomNav?: Nav;
}
