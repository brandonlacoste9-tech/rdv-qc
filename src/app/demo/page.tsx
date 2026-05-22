import { redirect } from "next/navigation";

export default function DemoPage() {
  // Redirect to the consultation event type
  redirect("/consultation-30min");
}
