import type {
  Metadata,
} from "next";

import {
  NotificationProvider,
} from "@/components/notification/NotificationProvider";

import "./styles.css";

export const metadata:
  Metadata = {
    title: "PropertyOS",
    description:
      "PropertyOS admin portal",
  };

export default function RootLayout({
  children,
}: Readonly<{
  children:
    React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <NotificationProvider>
          {children}
        </NotificationProvider>
      </body>
    </html>
  );
}
