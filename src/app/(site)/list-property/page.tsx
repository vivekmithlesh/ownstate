// OwnState — List Property (Brick 10)
// Server wrapper: requires login, then renders the client wizard.

import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { ListPropertyWizard } from "@/components/list/ListPropertyWizard";

export const metadata: Metadata = {
  title: "List your property",
  description: "List your land or property on OwnState in a few guided steps.",
};

export default async function ListPropertyPage() {
  const user = await requireUser("/list-property");
  return <ListPropertyWizard userId={user.id} />;
}
