import localFont from "next/font/local";

export const zina = localFont({
  src: "../assets/fonts/Zina-Regular.woff2",
  variable: "--font-zina",
  weight: "400",
  display: "swap",
});

export const clash = localFont({
  src: "../assets/fonts/ClashDisplay-Variable.woff2",
  variable: "--font-clash",
  display: "swap",
});

export const cabinet = localFont({
  src: "../assets/fonts/CabinetGrotesk-Variable.woff2",
  variable: "--font-cabinet",
  display: "swap",
});

export const nippo = localFont({
  src: "../assets/fonts/Nippo-Variable.woff2",
  variable: "--font-nippo",
  display: "swap",
});

export const fontVariables = [
  zina.variable,
  clash.variable,
  cabinet.variable,
  nippo.variable,
].join(" ");
